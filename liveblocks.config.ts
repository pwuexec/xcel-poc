import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const client = createClient({
    publicApiKey: "pk_dev_bxD15RXf_28VLFSNBolDk6pF2gOF4FK-s-MTwzJ1Bc_KYofJw_qEFoBZfQSlMhsv",
});

type Presence = {
    // Empty for now - no cursor tracking
};

// No storage - using Convex instead
type Storage = {};

export const {
    suspense: {
        RoomProvider,
        useRoom,
        useMyPresence,
        useUpdateMyPresence,
        useOthers,
        useSelf,
        useOthersMapped,
        useOthersConnectionIds,
        useOther,
        useBroadcastEvent,
        useEventListener,
        useErrorListener,
        useStorage,
        useHistory,
        useUndo,
        useRedo,
        useCanUndo,
        useCanRedo,
        useMutation,
        useStatus,
        useLostConnectionListener,
    },
} = createRoomContext<Presence, Storage>(client);
