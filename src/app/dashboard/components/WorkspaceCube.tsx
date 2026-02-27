import { useRef, useMemo, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { Html, RoundedBox, Edges } from '@react-three/drei';
import * as THREE from 'three';
import { useGridStore, Workspace3D } from '@/store/useGridStore';
import { useSpring, animated, config } from '@react-spring/three';
import { useDrag } from '@use-gesture/react';

interface WorkspaceCubeProps {
    workspace: Workspace3D;
}

export function WorkspaceCube({ workspace }: WorkspaceCubeProps) {
    // Selectors
    const draggingId = useGridStore((state) => state.draggingId);
    const updateWorkspacePosition = useGridStore((state) => state.updateWorkspacePosition);
    const setDraggingId = useGridStore((state) => state.setDraggingId);

    // State
    const isDragging = draggingId === workspace.id;
    const [hovered, setHovered] = useState(false);
    const [localPos, setLocalPos] = useState<[number, number, number] | null>(null);
    const three = useThree();

    // Memoized Colors from hex
    const { color, glowColor, bgOpacity } = useMemo(() => {
        const c = new THREE.Color(workspace.color);
        const g = new THREE.Color(workspace.color).multiplyScalar(2);
        return { color: c, glowColor: g, bgOpacity: 0.8 };
    }, [workspace.color]);

    // Drag Logic (Safe Implementation)
    const bind = useDrag(({ active, timeStamp }) => {
        if (active) {
            // Raycast against the infinite floor plane at y=0
            const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
            three.raycaster.setFromCamera(three.mouse, three.camera);
            const target = new THREE.Vector3();

            // Check intersection safely
            const intersect = three.raycaster.ray.intersectPlane(floorPlane, target);

            if (intersect) {
                // Determine new grid coordinates
                const snappedX = Math.round(target.x);
                const snappedZ = Math.round(target.z);

                // Start drag session if not already started
                if (draggingId !== workspace.id) setDraggingId(workspace.id);
                setLocalPos([snappedX, 0.5 + workspace.stackIndex, snappedZ]);
            }
        } else {
            // End drag session
            setDraggingId(null);
            if (localPos) {
                updateWorkspacePosition(workspace.id, localPos[0], localPos[2]);
                setLocalPos(null);
            }
        }
    }, { filterTaps: true, delay: true });

    // Animation Config
    const targetPosition = localPos || [
        workspace.gridX,
        0.5 + workspace.stackIndex,
        workspace.gridZ
    ] as [number, number, number];

    const { position, scale } = useSpring({
        position: targetPosition,
        scale: hovered && !isDragging ? 1.1 : 1,
        config: (key: string) => key === 'position' && isDragging
            ? { tension: 500, friction: 50 }
            : config.wobbly
    });

    return (
        <animated.group
            position={position as any}
            scale={scale as any}
            {...bind()}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
        >
            {/* 1. Main Cube Body (Simplified Material for Max Stability) */}
            <RoundedBox args={[0.8, 0.8, 0.8]} radius={0.05} castShadow receiveShadow={false}>
                <meshStandardMaterial
                    color="white"
                    opacity={bgOpacity}
                    transparent
                    roughness={0.2}
                    metalness={0.1}
                />

                {/* 2. Optimized Edges (Replaces manual EdgesGeometry) */}
                <Edges
                    threshold={15}
                    color={glowColor}
                    scale={1.05} // Slightly larger to prevent Z-fighting
                />
            </RoundedBox>

            {/* 3. Inner Core (Colored Block) */}
            <mesh>
                <boxGeometry args={[0.4, 0.4, 0.4]} />
                <meshStandardMaterial color={workspace.color} />
            </mesh>

            {/* 4. Floating Label (UI) */}
            <Html position={[0, 1.2, 0]} center transform sprite distanceFactor={10} style={{ pointerEvents: 'none' }}>
                <div style={{
                    background: 'rgba(0,0,0,0.85)',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: `1px solid ${workspace.color}`,
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    minWidth: '100px',
                    textAlign: 'center',
                    userSelect: 'none'
                }}>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>{workspace.title}</span>
                    <span style={{ fontSize: '11px', opacity: 0.8 }}>Lv.{workspace.level} • {workspace.category}</span>
                </div>
            </Html>
        </animated.group>
    );
}
