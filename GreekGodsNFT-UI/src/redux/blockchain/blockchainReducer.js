const initialState = {
  loading: false,
  account: null,
  smartContract: null,
  web3: null,
  errorMsg: "",
};

const blockchainReducer = (state = initialState, action) => {
  switch (action.type) {
    case "CONNECTION_REQUEST":
      return {
        ...initialState,
        loading: true,
      };
    case "CONNECTION_SUCCESS":
      return {
        ...state,
        loading: false,
        account: action.payload.account,
        smartContract: action.payload.smartContract,
        web3: action.payload.web3,
      };
    case "CONNECTION_FAILED":
      return {
        ...initialState,
        loading: false,
        errorMsg: action.payload,
      };
    case "UPDATE_ACCOUNT":
      return {
        ...state,
        account: action.payload.account,
      };
    case "DISCONNECT_REQUEST":
      return {
        ...state,
        loading: true,
        };
    case "DISCONNECT_SUCCESS":
      return {
        ...initialState, // Reset the state to initial state on disconnect
        loading: false,
        };
    case "DISCONNECT_FAILED":
      return {
        ...state, 
        loading: false,
        errorMsg: action.payload,
      };  
    default:
      return state;
  }
};

export default blockchainReducer;
