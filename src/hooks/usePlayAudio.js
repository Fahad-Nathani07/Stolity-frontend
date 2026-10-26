import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setAudioQueue } from "../store/fileSlicer";
import { buildAudioQueueFromFiles } from "../utils/audioPlayer";

/**
 * Play audio via the global floating player.
 * Freezes shared-folder context on the queue so leaving the folder
 * (or clearing isSharedValue) does not break current / next / previous.
 *
 * @param {Array} allFiles - full folder list (not paginated slice)
 * @param {string} clickedFileName
 * @param {{ shared?: boolean, sharedName?: string }} [options] - optional override
 */
export function usePlayAudio() {
  const dispatch = useDispatch();
  const isSharedValue = useSelector((state) => state.getdata.isSharedValue);
  const sharedFolderName = useSelector((state) => state.getdata.fileName);

  const playAudioFile = useCallback(
    (allFiles, clickedFileName, options = {}) => {
      const { queue, index } = buildAudioQueueFromFiles(
        allFiles,
        clickedFileName
      );
      if (queue.length === 0) return;

      const shared =
        options.shared !== undefined
          ? Boolean(options.shared)
          : Boolean(isSharedValue);
      const sharedName = shared
        ? String(
            options.sharedName !== undefined
              ? options.sharedName
              : sharedFolderName || ""
          ).trim()
        : "";

      dispatch(
        setAudioQueue({
          queue,
          index,
          shared,
          sharedName,
        })
      );
    },
    [dispatch, isSharedValue, sharedFolderName]
  );

  return { playAudioFile };
}
