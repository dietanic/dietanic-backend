export const simulateImageOptimization = async (onProgress: (percent: number, saved: string) => void): Promise<void> => {
    const steps = 20;
    let savedMB = 0;
    for (let i = 1; i <= steps; i++) {
        await new Promise(r => setTimeout(r, 150)); // Simulating work
        savedMB += Math.random() * 0.5;
        onProgress(i * (100/steps), savedMB.toFixed(2));
    }
};
