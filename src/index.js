import React from "react";
import ReactDOM from "react-dom";
import store, { useRemoduler } from "./mod";
import { Provider } from "react-redux";

function Toggle() {
  const { state, actions } = useRemoduler("moduleB");
  return (
    <div>
      <input
        type="checkbox"
        onChange={() => {
          actions.getAddress("asd", "qwe");
        }}
      />
      {Object.keys(state)}
    </div>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <Toggle />
    </Provider>
  </React.StrictMode>,
  rootElement
);
