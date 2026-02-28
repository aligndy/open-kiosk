"use client";

import { useEffect, useRef } from "react";
import { useUiStore } from "@/stores/uiStore";

export default function CameraAgeDetector() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const { isVendingMode, setVendingMode, setShowAgeDetectionToast } = useUiStore();
    const hasCaptured = useRef(false);

    useEffect(() => {
        // If already in vending mode or already captured, skip
        if (isVendingMode || hasCaptured.current) return;

        let stream: MediaStream | null = null;
        let timeoutId: NodeJS.Timeout;
        let isCancelled = false;

        const startCameraAndCapture = async () => {
            if (isCancelled) return;
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (isCancelled) {
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }

                // Wait a short moment for the video to start playing and camera sensor to adjust
                await new Promise((resolve) => {
                    timeoutId = setTimeout(resolve, 1500);
                });

                if (isCancelled || !videoRef.current || hasCaptured.current) return;

                hasCaptured.current = true;

                const canvas = document.createElement("canvas");
                const videoWidth = videoRef.current.videoWidth;
                const videoHeight = videoRef.current.videoHeight;

                if (videoWidth === 0 || videoHeight === 0) return;

                canvas.width = videoWidth;
                canvas.height = videoHeight;
                const ctx = canvas.getContext("2d");
                if (!ctx) return;

                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

                canvas.toBlob(async (blob) => {
                    if (!blob || isCancelled) return;

                    const formData = new FormData();
                    formData.append("image", new File([blob], "capture.jpg", { type: "image/jpeg" }));

                    try {
                        const res = await fetch("/api/estimate-age", {
                            method: "POST",
                            body: formData,
                        });
                        const data = await res.json();
                        console.log("estimateAge result:", data);

                        if (res.ok && data.isVendingMode) {
                            setVendingMode(true);
                            setShowAgeDetectionToast(true);
                        }
                    } catch (e) {
                        console.error("Failed to estimate age", e);
                    } finally {
                        // Stop stream after capture attempt
                        if (stream) {
                            stream.getTracks().forEach(track => track.stop());
                        }
                    }
                }, "image/jpeg", 0.8);

            } catch (err) {
                // Camera access denied or not available, gracefully fail
                console.warn("Camera access denied or not available", err);
            }
        };

        startCameraAndCapture();

        return () => {
            isCancelled = true;
            if (timeoutId) clearTimeout(timeoutId);
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isVendingMode, setVendingMode, setShowAgeDetectionToast]);

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ display: "none" }}
        />
    );
}
