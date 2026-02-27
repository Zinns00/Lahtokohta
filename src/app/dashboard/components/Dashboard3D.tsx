"use client";

import { Canvas } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera, Environment } from '@react-three/drei';
import { GridSystem } from './GridSystem';
import { useGridStore } from '@/store/useGridStore';
import { Suspense, useEffect, useState } from 'react';
import { WorkspaceCube } from './WorkspaceCube';
import { WorkspaceOverlay } from './ui/WorkspaceOverlay';

export default function Dashboard3D() {
    const workspaces = useGridStore((state) => state.workspaces);
    const cameraView = useGridStore((state) => state.cameraView);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            {/* New Overlay */}
            <WorkspaceOverlay />

            {/* Remove shadows temporarily to debug crash */}
            <Canvas gl={{ antialias: true, alpha: true }}>
                {/* Transparent background by default so it shows the white card behind it */}

                {/* Camera Setup */}
                {cameraView === 'ISOMETRIC' ? (
                    <OrthographicCamera
                        makeDefault
                        position={[20, 20, 20]}
                        zoom={40}
                        near={-50}
                        far={200}
                        onUpdate={(c) => c.lookAt(0, 0, 0)}
                    />
                ) : (
                    <OrthographicCamera
                        makeDefault
                        position={[0, 50, 0]}
                        zoom={30} // Zoom out slightly
                        near={-50}
                        far={200}
                        onUpdate={(c) => c.lookAt(0, 0, 0)}
                    />
                )}

                <OrbitControls
                    enableRotate={cameraView === 'ISOMETRIC'}
                    enableZoom={true}
                    maxPolarAngle={Math.PI / 2.1} // Don't go below ground
                    minZoom={20}
                    maxZoom={100}
                />

                {/* Lighting (Updated for Light Mode) */}
                <ambientLight intensity={0.8} />
                <directionalLight position={[10, 20, 10]} intensity={1.2} />

                <Suspense fallback={null}>
                    <Environment preset="city" />
                </Suspense>

                {/* World */}
                <GridSystem />

                {/* Workspaces */}
                <Suspense fallback={null}>
                    {workspaces.map((ws) => (
                        <WorkspaceCube key={ws.id} workspace={ws} />
                    ))}
                </Suspense>
            </Canvas>
        </div>
    );
}
