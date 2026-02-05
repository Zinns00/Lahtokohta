import { useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { Plane, Grid } from '@react-three/drei';
import * as THREE from 'three';

interface GridSystemProps {
    onPointerMove?: (e: any) => void;
}

export function GridSystem({ onPointerMove }: GridSystemProps) {
    const { viewport } = useThree();

    return (
        <group>
            {/* Infinite Grid Helper */}
            <Grid
                position={[0, -0.01, 0]}
                args={[100, 100]} // Size
                cellSize={1}
                cellThickness={0.6}
                cellColor="#6b7280"
                sectionSize={5}
                sectionThickness={1}
                sectionColor="#9ca3af"
                fadeDistance={30}
                infiniteGrid
            />

            {/* Invisible Plane for Raycasting/Dragging */}
            <Plane
                args={[100, 100]}
                rotation={[-Math.PI / 2, 0, 0]}
                visible={false}
                onPointerMove={onPointerMove}
            />
        </group>
    );
}
