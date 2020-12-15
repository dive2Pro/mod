/* eslint-disable */
// what i want
import { connect, useDispatch, useSelector, useStore } from "react-redux";
import { produce } from "immer";
import React from "react";
import { applyMiddleware, combineReducers, compose, createStore } from "redux";
import thunk from "redux-thunk";

/**
 *
 * @register(['moduleA', 'moduleB'])
 * // 会注入 store.getState()[moduleA] 和 store.getState()[moduleB] 和 dispatch 到组件的实例上
 * moduleA 上面有 state 和 moduleA.actions ()
 * class AContainer extends React.PureComponent {
 *      render() {
 *          const { moduleA, moduleB, dispatch } = this.props;
 *
 *      }
 * }
 *
 * // 如果 传入的 module 为空的话, 默认取全局的 state 和 dispatch, actions 下为空
 *
 * function App() {
 *
 *  const {state, dispatch} = useRemoduler('moduleA');
 *
 *  const {state, dispatch} = useRemoduler();
 *
 * }
 */

/**
 *
 * @param {*} modules:
 * - 可以是 ['moduleB'] 这样会监听整个 module 的改变
 * - 或者 { module: 'moduleB',  state : () => {} , actions: () => {} } 只有当这些变化的时候才触发 rerender
 * @param {*} setup
 */
export const register = (modules) => {
  if (Array.isArray(modules)) {
      // 
  } else if (
    typeof modules === "string" ||
    (typeof modules === "object" && Object.keys(modules).length > 0)
  ) {
    modules = [modules];
  } else if (!modules || Object.keys(modules).length === 0) {
    modules = [];
  }
  return (WrapperComponent) => {
    const mapStateToProps = (state, ...rest) => {
      const mapState = {};
      modules.forEach((mod) => {
        if (mod.state) {
          mapState[mod.module] = mod.state(state[mod.module], ...rest);
        } else {
          mapState[mod] = state[mod] || state[mod.module];
        }
      });
      return Object.keys(mapState).length > 0 ? mapState : undefined;
    };

    const mapDispatchToProps = (dispatch) => {
      let mapDispatch = {
          dispatch
      };
      modules.forEach((mod) => {
        if (mod.actions) {
          mapDispatch = {
            ...mapDispatch,
            ...mod.actions.reduce((p, actionName) => {
              p[actionName] = store._store[mod.module].actions[actionName];
              return p;
            }, {}),
          };
        } else {
          const module = store._store[mod] || store._store[mod.module];
          mapDispatch = { ...mapDispatch, ...module.actions };
        }
      });

      return mapDispatch;
    };
    return connect(mapStateToProps, mapDispatchToProps)(WrapperComponent);
  };
};

/**
 *
 * @param {string} module
 */
export const useRemoduler = (module) => {
  const st = useStore();
  const state = useSelector((state) => state[module]);

  if (!state) {
    throw new Error(`reducer ${module} 没有被声明`);
  }

  const actions = st._store[module].actions;

  return {
    state,
    actions,
  };
};

const Action = {};

// 如何渐进改造呢?
/**
 *  支持两种方式:  reducer 的改造:
 *
 */

const moduleA = {
  module: "A",
  actions: {
    setAddress(data) {
      return (dispatch) => {
        dispatch({
          type: SET_ADDRESS,
          ...data,
        });
      };
    },
    setA(latitude, longitude, addressName) {
      return async (dispatch) => {
        dispatch({
          type: GET_ADDRESS_REQUEST,
        });

        const reLocation = await NativeUtil.searchRegeocode(
          String(latitude),
          String(longitude)
        );
        const { addressComponent } = reLocation.response;

        const cityName = addressComponent.city;
        const regionName = addressComponent.district;
        const townName = addressComponent.township;
        const streetName = addressComponent.streetNumber.street;

        let city = "";
        let region = "";
        if (cityName) {
          city = cityName;
          if (regionName) {
            region = regionName;
          } else if (townName) {
            region = townName;
          }
        } else if (regionName) {
          city = regionName;
          if (townName) {
            region = townName;
          } else if (streetName) {
            region = streetName;
          }
        }

        // 省市区
        const locationData = [addressComponent.province, city, region];

        const res = {
          cityCode: addressComponent.citycode,
          adCode: addressComponent.adcode,
          provinceName: addressComponent.province,
          cityName: city,
          regionName: region,
          locationData,
          detailAddress: addressName,
          latitude: latitude,
          longitude: longitude,
        };

        dispatch({
          type: GET_ADDRESS_SUCCESS,
          addressInfo: res,
        });
      };
    },
  },
  initState: {
    type: "",
    adCode: "", // 高德位置编号
    cityCode: "", // 高德城市编号
    provinceName: "", // 所在省
    cityName: "", // 所在城市
    regionName: "", // 所在区/镇/县/街道
    locationData: [], // 省市区集合
    detailAddress: "", // 详细地址名称
    latitude: "", // 纬度
    longitude: "", // 经度
    cityDivisionId: "", // 菜鸟城市id
    coreDivisionId: "", // 菜鸟区域id
    coreDivisionLevel: "", // 菜鸟核心区域级别 用于样式判断

    handDivisionId: "", // 手动选择的菜鸟区域id
    handDivisionName: "", // 手动选择的菜鸟区域名

    isHandle: false, // 是否手动选择
    addressInfo: null,
  },
  reducer(state = {}, action) {
    switch (action.type) {
      case Action.SET_ADDRESS:
        return _.assign({}, state, action);

      case Action.INIT_ADDRESS:
        // 初始化所有数据
        return _.assign({}, initData, {
          type: action.type,
        });
      case Action.GET_ADDRESS_REQUEST:
        return _.assign({}, state, {
          type: action.type,
        });
      case Action.GET_ADDRESS_SUCCESS:
        // 获取定位
        return _.assign({}, state, {
          type: action.type,
          addressInfo: action.addressInfo,
        });
      default:
        return state;
    }
  },
};

/**
 * 新版
 */

const moduleB = {
  type: "new",
  initState: {},
  state: {},
  actions: {
    setAddress(ctx, data) {},
    async getAddress(ctx, latitude, longitude, addressName) {
      this.isRequesting();
      // 当修改的时候, 触发 store.dispatch
      const reLocation = await new Promise((resolve) => {
        setTimeout(() => {
          resolve("haha");
        }, 1000);
      });
      // ...
      const res = {
        reLocation,
      };
      this.onSuccess(res);
    },
  },
  reducers: {
    init(state) {
      state = this.initState;
    },
    isRequesting(state) {
      state.type = "isRequesting";
    },
    onSuccess(state, payload) {
      state.addressInfo = payload;
    },
  },
};

let store;
export const configurationStore = (mods, middlewares) => {
  const ObjReducers = {};
  const Obj = {};
  for (const modKey in mods) {
    if (mods.hasOwnProperty(modKey)) {
      const item = mods[modKey];
      if (item.type === "new") {
        const { initState, reducers, actions } = item;
        const { state = initState } = item;
        Obj[modKey] = { ...item, state };

        const actionKeys = Object.keys(actions);
        // reducers

        for (const key in reducers) {
          const reducer = reducers[key];
          reducers[key] = (...args) => {
            Obj[modKey].state = produce(Obj[modKey].state, (draft) => {
              reducer(draft, ...args);
            });

            store.dispatch({ type: modKey, payload: Obj[modKey].state });
            console.log(Obj[modKey].state, "---- ");
          };
          item[key] = reducers[key];
        }

        ObjReducers[modKey] = (initState = {}, action) => {
          if (action.type === modKey) {
            return action.payload;
          }
          return initState;
        };
        // actions

        for (const actionKey of actionKeys) {
          const action = actions[actionKey].bind(mods[modKey]);
          mods[modKey].actions[actionKey] = function (...args) {
            action(store, ...args);
          };
        }
      } else {
        ObjReducers[modKey] = item.reducer;
      }

      Obj[modKey] = mods[modKey];
    }
  }

  store = createStore(
    combineReducers(ObjReducers),
    {},
    compose(
      applyMiddleware(...middlewares, () => (next) => (action) => {
        if (action.type.indexOf("/") > -1) {
          // 当以 moduleB/actionName 为 type 时, 触发action which cause trigger action.type = modeKey
          const [moduleName, actionName] = action.type.split("/");
          const newModule = Obj[moduleName];
          if (!newModule) {
            console.warn(`${moduleName} 不在 store 中, 请检查`);
            return next();
          }

          if (newModule.actions[actionName]) {
            newModule.actions[actionName](action.payload);
          }
        }
        next(action);
      })
    )
  );
  store._store = Obj;
  store.getNew = () => Obj;
  return store;
};

export default configurationStore(
  {
    moduleA,
    moduleB,
  },
  [thunk]
);
