import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useSearchParamsState } from "@/hooks/useSearchParamsState";


export function BookingStatusFilter() {
    const { setParam, removeParam, getParam } = useSearchParamsState();
    const statusFilter = getParam("status") || "all";

    const handleStatusChange = (value: string) => {
        if (value === "all") {
            removeParam("status");
        } else {
            setParam("status", value);
        }
    };


    return (
        <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>Status</SelectLabel>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="awaiting_payment">Awaiting Payment</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="canceled">Canceled</SelectItem>
                </SelectGroup>
            </SelectContent>
        </Select>
    );
}
