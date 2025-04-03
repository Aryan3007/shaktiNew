const BET_SELECTION_EVENT = "betSelection";

export const betSelectionEvent = {
  // Dispatch when a bet is selected
  dispatch: (source) => {
    const event = new CustomEvent(BET_SELECTION_EVENT, {
      detail: { source },
    });
    window.dispatchEvent(event);
  },

  // Listen for bet selection events
  listen: (callback) => {
    const eventListener = (event) => callback(event);
    window.addEventListener(BET_SELECTION_EVENT, eventListener);
    return () => {
      window.removeEventListener(BET_SELECTION_EVENT, eventListener);
    };
  },
};
