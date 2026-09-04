import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { setAudioQueue } from "../store/fileSlicer";
import { buildAudioQueueFromFiles } from "../utils/audioPlayer";

/**
 * Play audio via the global floating player.
 * @param {Array} allFiles - full folder list (not paginated slice)
 * @param {string} clickedFileName
 */
export function usePlayAudio() {
  const dispatch = useDispatch();

  const playAudioFile = useCallback(
    (allFiles, clickedFileName) => {
      const { queue, index } = buildAudioQueueFromFiles(
        allFiles,
        clickedFileName
      );
      if (queue.length === 0) return;
      dispatch(setAudioQueue({ queue, index }));
    },
    [dispatch]
  );

  return { playAudioFile };
}
