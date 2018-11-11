
import {call, put} from 'redux-saga/effects';
import {path} from 'ramda';

/**
 *
 *  Auto generating action types,action creator,reducer,saga just from action pre-type
 *  example for naming convient:
 *
 *   pretype:COMMENT
 *   types:[COMMENT_REQUEST,COMMENT_SUCCESS,COMMENT_FAIL,COMMENT_CLEAN]
 *   actionCreator:[commentRequest,commentSuccess,commentFail,commentClean]
 *   reducer:[comment]
 *   saga:[commentSaga]
 *
 *
 */


/**
 *  actions is array of object that have content same as described at below example:
 *    actions = [
 *      {
 *         type:"comment" //each type convert to four async action
 *         apiCall:testList // api that have network call
 *         responseExtractor:(Optional) function that extract part of server response that you need.
 *      }
 *    ]
 * @param actions
 * @returns {{actions, actionCreators, reducers, sagas}}
 */
export const reduxAsyncHelper = (actions)=>{
  let types = {} ;
  let actionCreators = {} ;
  let reducers = {} ;
  let sagas = {};

  actions.forEach(function (meta) {

    let requestAction = meta.type+"_REQUEST" ;
    let failAction = meta.type+"_FAILED" ;
    let successAction =  meta.type+"_SUCCESS" ;
    let cleanAction = meta.type+"_CLEAN" ;

    types[requestAction] =requestAction;
    types[successAction] = successAction;
    types[failAction] =failAction;
    types[cleanAction] = cleanAction;

    //actionCreators
    let typeLower = meta.type.replace("_","");
    typeLower=  typeLower.toLocaleLowerCase();
    actionCreators[typeLower+"Request"]=makeAction(requestAction);
    actionCreators[typeLower+"Fail"]=makeAction(failAction);
    actionCreators[typeLower+"Success"]=makeAction(successAction);
    actionCreators[typeLower+"Clean"]=makeAction(cleanAction);

    reducers[typeLower] = makeAsyncReducer(meta.type);

    sagas[typeLower+"Saga"] = makeSaga(
      actionCreators[typeLower+"Success"],
      actionCreators[typeLower+"Fail"],
      meta.responseExtractor || false ,
      meta.apiCall  ) ;

  });



  return {
    actions:types,
    actionCreators:actionCreators,
    reducers:reducers ,
    sagas:sagas
  }
}



/**
 *
 *
 *
 *
 */




export const makeAction = (type)=>{

    return function (args) {
        return {
            type:type ,
            payload:args
        }
    }
}

export const makeAsyncReducer = (type,lowerCaseType)=>{

    return function (state={fetching: false, error: false,success:false},action) {
        switch (action.type) {
            case type+"_REQUEST":
                return {
                    //...state,
                    ...action.payload,
                    fetching: true,
                    error:false,
                    success:false
                };

            case type+"_SUCCESS":
                return {
                    fetching: false,
                    error:false ,
                    success:true,
                    result:action.payload,
                  //  ...state,
                };

            case type+"_FAILED" :
                return {
                   // ...state,
                    fetching: false,
                    error:true,
                    success:false
                };

            case type+"_CLEAN" :
                return {
                    fetching: false,
                    error: false,
                    success:false
                };


            default:
                return state;
        }
    }
}

export const makeSaga = function (successAction,failAction,responseExtractor,remoteApiCall) {

    return function* (action) {
        const response = yield call(remoteApiCall,action.payload);


        if (response.ok) {
            let result = path(['data'], response);
            if(responseExtractor ){
                 result = responseExtractor(result);
            }

            yield put(successAction(result));

        } else {
            yield put(failAction());

        }
    }


}


