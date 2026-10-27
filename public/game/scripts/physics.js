// Summit Leap v0.8.3 — extracted unchanged from v0.8.1.
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
class PolePhysicsEngine {
    static PLANT_OFFSET = 120;
    static DEFAULT_RIDE_SECONDS = 1.75;
    static LATE_SECONDS = 0.65;
    static validatePlantPoint(px, py, facingDir, platforms, _config) {
        const dir = facingDir >= 0 ? 1 : -1;
        const targetX = px + dir * this.PLANT_OFFSET;
        const current = platforms.find(plat => {
            const left = plat.x - plat.width / 2;
            const right = plat.x + plat.width / 2;
            const top = plat.y - plat.height / 2;
            return px >= left && px <= right && Math.abs(py + 22 - top) < 35;
        });
        if (!current)
            return {
                isValid: false, anchorX: targetX, anchorY: py + 22,
                distance: this.PLANT_OFFSET, angle: 0, reason: 'Player must be standing on a ledge',
            };
        const left = current.x - current.width / 2;
        const right = current.x + current.width / 2;
        const top = current.y - current.height / 2;
        const distance = Math.hypot(targetX - px, top - py);
        const angle = Math.atan2(top - py, targetX - px);
        if (targetX < left || targetX > right)
            return {
                isValid: false, anchorX: targetX, anchorY: top, distance, angle,
                reason: 'Plant point would miss the launch ledge',
            };
        return { isValid: true, anchorX: targetX, anchorY: top, distance, angle };
    }
    static initVault(px, py, vx, vy, anchorX, anchorY, config) {
        const facingDir = anchorX >= px ? 1 : -1;
        const approachSpeed = Math.max(0, facingDir * vx);
        const power = clamp(approachSpeed / Math.max(1, config.maxRunSpeed), 0, 1);
        const rideDuration = this.DEFAULT_RIDE_SECONDS;
        const chord = Math.hypot(px - anchorX, py - anchorY);
        return {
            anchorX, anchorY, facingDir,
            theta: Math.atan2(anchorY - py, facingDir * (anchorX - px)),
            omega: 0, radius: chord, startPx: px, startPy: py,
            strain: 0, deformationPx: 0, storedEnergy: 0, bendOffset: 0,
            springForce: 0, bendingTorque: 0, radialVelocity: 0,
            tangentialVelocity: approachSpeed, heightGained: 0,
            distanceTraveled: 0, phase: 'APPROACH',
            elapsed: 0, rideDuration, initialVx: vx, initialVy: vy,
            liftCapacity: 190 * (0.62 + 0.38 * Math.sqrt(power)) * (config.arcadeLift ?? 1),
        };
    }
    static stepVault(state, dt, config, _px, _py, _vx, _vy) {
        const t = state.elapsed + dt;
        const T = state.rideDuration;
        const u = clamp(t / T, 0, 1);
        const vx0 = state.initialVx;
        const vy0 = state.initialVy;
        const H = state.liftCapacity;
        const forwardPower = clamp(Math.abs(vx0) / Math.max(1, config.maxRunSpeed), 0, 1);
        const cruise = 35 + 53 * forwardPower;
        const tau = 0.48;
        let x = state.startPx + (vx0 - state.facingDir * cruise) * tau * (1 - Math.exp(-t / tau)) + state.facingDir * cruise * t;
        let vx = (vx0 - state.facingDir * cruise) * Math.exp(-t / tau) + state.facingDir * cruise;
        const ease = u * u * (3 - 2 * u);
        const easePrime = 6 * u * (1 - u);
        let y = state.startPy + vy0 * t - H * ease;
        let vy = vy0 - (H / T) * easePrime;
        if (t > T) {
            const late = t - T;
            const xAtEnd = state.startPx + (vx0 - state.facingDir * cruise) * tau * (1 - Math.exp(-T / tau)) + state.facingDir * cruise * T;
            const vxAtEnd = (vx0 - state.facingDir * cruise) * Math.exp(-T / tau) + state.facingDir * cruise;
            x = xAtEnd + vxAtEnd * (1 - Math.exp(-late));
            vx = vxAtEnd * Math.exp(-late);
            y = state.startPy + vy0 * t - H + 0.5 * config.gravity * 0.3 * late * late;
            vy = vy0 + config.gravity * 0.3 * late;
        }
        const dir = state.facingDir;
        const dx = x - state.anchorX;
        const dy = y - state.anchorY;
        const radius = Math.hypot(dx, dy);
        const theta = Math.atan2(-dy, -dir * dx);
        const bendFraction = t < T ? Math.pow(Math.max(0, Math.sin(Math.PI * Math.min(0.98, u))), 0.85) : 0;
        const power = 0.52 + 0.48 * Math.sqrt(clamp(Math.abs(vx0) / Math.max(config.maxRunSpeed, 1), 0, 1));
        const deformationPx = config.poleLength * config.maxDeformation * power * bendFraction;
        const strain = clamp(deformationPx / Math.max(config.poleLength * config.maxDeformation, 1), 0, 1);
        const storedEnergy = 0.5 * config.poleStiffness * deformationPx * deformationPx;
        const springForce = config.poleStiffness * deformationPx;
        const phase = t >= T ? 'UNCOILED'
            : u < 0.23 ? 'LOADING'
                : u < 0.48 ? 'MAX_FLEX'
                    : u < 0.9 ? 'RECOILING' : 'UNCOILED';
        const stateNext = {
            ...state, elapsed: t, theta, radius,
            omega: 0, strain, deformationPx, storedEnergy,
            bendOffset: deformationPx * 0.8, springForce,
            bendingTorque: 0, radialVelocity: 0,
            tangentialVelocity: Math.hypot(vx, vy),
            heightGained: Math.max(0, state.startPy - y),
            distanceTraveled: Math.abs(x - state.startPx), phase,
        };
        const handDx = x + 3 - state.anchorX;
        const handDy = y - 5 - state.anchorY;
        const chord = Math.hypot(handDx, handDy);
        const softRadius = Math.max(60, config.poleLength - 28);
        const room = 26;
        if (chord > softRadius) {
            const limited = softRadius + room * (1 - Math.exp(-(chord - softRadius) / room));
            const scale = limited / chord;
            x = state.anchorX + handDx * scale - 3;
            y = state.anchorY + handDy * scale + 5;
            vx = (x - (state.lastX ?? state.startPx)) / dt;
            vy = (y - (state.lastY ?? state.startPy)) / dt;
        }
        stateNext.radius = Math.hypot(x + 3 - state.anchorX,y - 5 - state.anchorY);
        stateNext.lastX = x; stateNext.lastY = y;
        return {
            state: stateNext, nextPx: x, nextPy: y,
            nextVx: vx, nextVy: vy,
            shouldAutoRelease: t >= T + this.LATE_SECONDS,
        };
    }
    static calculateReleaseVelocity(vx, vy, state, config) {
        // Frozen pre-Phase-8 landing sampler. Used ONLY to preserve archived
        // v0.9.16 procedural geometry, never for a player's actual vault.
        if(config.archivedArcadePhysics===true){
            const approach=Math.max(0,state.facingDir*state.initialVx);
            const ratio=clamp(approach/Math.max(1,config.maxRunSpeed),0,1);
            const assist=approach<20?.08:.62+.38*Math.sqrt(ratio);
            const u=clamp(state.elapsed/state.rideDuration,0,1);
            const late=Math.max(0,state.elapsed-state.rideDuration);
            const latePenalty=Math.exp(-1.6*late);
            return {
                vx:state.facingDir*(610-200*u)*assist*latePenalty*
                   (config.arcadeRange??1),
                vy:-(185+330*u)*assist*latePenalty*
                   (config.arcadeLift??1)+config.gravity*.5*late
            };
        }
        // Phase 8: deterministic player-controlled release. Speed, loading
        // position and launch timing all affect trajectory. No secret rescue.
        const ratio=clamp(Math.max(0,state.facingDir*state.initialVx)/
            Math.max(1,config.maxRunSpeed),0,1);
        const u=clamp(state.elapsed/state.rideDuration,0,1.35);
        const precision=Math.max(0.19,1-Math.abs(u-0.68)*1.22);
        const late=Math.exp(-3.6*Math.max(0,u-0.96));
        const strength=(0.18+0.82*Math.pow(ratio,1.9))*precision*late;
        const angle=clamp(u,0,1);
        return {
            // Full-sprint momentum unlocks longer, faster crossings. The
            // launch is not a flat distance boost: inadequate run-up lowers
            // both forward reach and lift under the same release timing.
            vx:state.facingDir*(825-205*angle)*strength*(config.arcadeRange??1),
            vy:-(215+355*angle)*strength*(config.arcadeLift??1)
                +config.gravity*0.5*Math.max(0,state.elapsed-state.rideDuration)
        };
    }
}


