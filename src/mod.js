/* eslint-disable */
// what i want
import { useDispatch, useSelector, useStore } from "react-redux";
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

export const register = (modules, setup) => {};

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
    getAddress(latitude, longitude, addressName) {
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
  reducer() {},
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

export const configurationStore = (mods, middlewares) => {
  const ObjReducers = {};
  const Obj = {};
  for (const modKey in mods) {
    if (mods.hasOwnProperty(modKey)) {
      const item = mods[modKey];
      if (item.type === "new") {
        const { initState,  reducers, actions } = item;
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
          switch (action.type) {
            case modKey:
              return action.payload;
            default:
              return initState;
          }
        };
        // actions

        for (const actionKey of actionKeys) {
          const action = actions[actionKey].bind(mods[modKey]);
          mods[modKey].actions[actionKey] = function (...args) {
            action(store, ...args);
          };
        }
        console.log(mods[modKey], " ----- @@@");
      } else {
      }

      Obj[modKey] = mods[modKey];
    }
  }

  const store = createStore(combineReducers(ObjReducers), {}, middlewares);
  store._store = Obj;
  return store;
};

export default configurationStore(
  {
    moduleA,
    moduleB,
  },
  compose(applyMiddleware(...[thunk]))
);
