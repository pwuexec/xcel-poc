import { CheckCircle2Icon } from "lucide-react";

interface Step {
    label: string;
    completed: boolean;
}

interface ProgressStepsProps {
    steps: Step[];
}

export function ProgressSteps({ steps }: ProgressStepsProps) {
    return (
        <div className="mb-4 sm:mb-6 flex flex-wrap items-center justify-center gap-2">
            {steps.map((step, index) => (
                <div key={step.label} className="flex items-center gap-2">
                    <div
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm ${
                            step.completed 
                                ? 'bg-primary/10 text-primary' 
                                : 'bg-muted text-muted-foreground'
                        }`}
                    >
                        {step.completed && <CheckCircle2Icon className="size-4 shrink-0" />}
                        <span className="font-medium whitespace-nowrap">{step.label}</span>
                    </div>
                    {index < steps.length - 1 && (
                        <div className="h-px w-4 sm:w-8 bg-border shrink-0" />
                    )}
                </div>
            ))}
        </div>
    );
}
