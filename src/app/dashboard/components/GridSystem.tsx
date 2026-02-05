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
            {/* Infinite Grid Helper - Light Mode */}
            <Grid
                position={[0, -0.01, 0]}
                args={[100, 100]} // Size
                cellSize={1}
                cellThickness={0.5}
                cellColor="#9CA3AF" // Darker Grey (Tailwind gray-400) - Visible on white
                sectionSize={5}
                sectionThickness={0.8}
                sectionColor="#4B5563" // Even darker (gray-600)
                fadeDistance={40}
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
