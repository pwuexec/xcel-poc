import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface FormErrorProps {
    error?: string;
}

export function FormError({ error }: FormErrorProps) {
    if (!error) return null;

    return (
        <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
    );
}
