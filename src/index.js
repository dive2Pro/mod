import React from "react";
import ReactDOM from "react-dom";
import store, { useRemoduler, register } from "./mod";
import { connect, Provider } from "react-redux";

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
class ToggleClassA extends React.Component {
  componentDidMount() {
    console.log(this.props);
  }

  render() {
    const state = this.props.moduleB;

    return (
      <div>
        <input
          type="checkbox"
          onChange={() => {
            // actions.getAddress("asd", "qwe");
            this.props.dispatch({
              type: "moduleB/getAddress",
              payload: "aha",
            });
          }}
        />
        {Object.keys(state)}
      </div>
    );
  }
}

class ToggleClassB extends React.Component {
  componentDidMount() {}

  render() {
    const state = this.props.moduleB;
    console.log(this.props, " - am B");

    return (
      <div>
        <input
          type="checkbox"
          onChange={() => {
            this.props.getAddress("I am B");
          }}
        />
        {Object.keys(state)}
      </div>
    );
  }
}

const ToggleClass = connect((state) => ({ moduleB: state.moduleB }))(
  ToggleClassA
);
const ToggleRegister = register([{
  module: "moduleB",
  state(state) {
    console.log(state, " ----=-=");
    return { type: state.addressInfo };
  },
  actions: ["getAddress"],
}, 'moduleA'])(ToggleClassB);

const rootElement = document.getElementById("root");
ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <Toggle />
      <ToggleClass />
      <ToggleRegister />
    </Provider>
  </React.StrictMode>,
  rootElement
);
