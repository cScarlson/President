
/**
 * @name: President
 * @desc: creates a new promise which adhere's to the Promise A+ specification
 */
var President = new (function President(){
	var STATIC = this;
	
	function MONAD(){
		return function unit(value){
			var monad = {};
			monad.bind = function(fn){
				return fn(value);
			};
			
			return monad;
		};
	}
	
	function currierFn(fn){
		return function(splat){
			fn.apply(null, arguments);
		};
	}
	
	function Deferrable(){
		function defer(){
			var deferred = { };
			var promise = new President(function exe(resolve, reject){
				deferred.resolve = resolve;
				deferred.reject = reject;
			});
			deferred.promise = promise;
			return deferred;
		}
		
		this.defer = defer;
	}
	
	Deferrable.apply(President);
	
	function President(initializer){
		if(!initializer){ throw new Error('Type Error: undefined is not a promise.'); }
		var self = this;
		var value
		  , fulfillmentHandler = function moot(r){ return r; }  // Promise A+ 2.2.1
		  , rejectionHandler = function moot(r){ return r; }  // Promise A+ 2.2.1
		  , catchHandler = function(){}
		;
		
		var states = {
			pending: true,
			fulfilled: false,
			rejected: false
		};
		
		function _getState(state){
			return states[state];
		}
		
		function _getStatus(){
			for(var key in states){
				if(states[key] === true){ return key; }
			}
			throw new Error('Status Error: Not state was found.');
		}
		
		function _setState(state){
			if('pending|fulfilled|rejected'.indexOf(state) < 0){ throw new Error('State-Set Error: Invalid state "' + state + '"'); }
			for(var key in states){ states[key] = false; }
			states[state] = true;
			self['[[PromiseStatus]]'] = state;
			self['[[PromiseValue]]'] = value;  // TODO: this is low coherence to "setting state"!
		}
		
		function _fulfill(onFulfilled, value, deferred) {
			var deferred = deferred
			  , promise2 = deferred.promise
			  , fulfillmentResult;

			try {
				fulfillmentResult = onFulfilled && onFulfilled.call && onFulfilled(value);
			} catch (err) {  // Promise A+ 2.2.7.2
				deferred.reject(err);
			}

			// Promise A+ 2.2.7
			if (!!fulfillmentResult) {  // Promise A+ 2.2.7.1
				deferred.resolve(fulfillmentResult);
			} else if (!(onFulfilled && onFulfilled.call)) {  // Promise A+ 2.2.7.3
				deferred.resolve(value);
			} else {  // Promise A+ specification?
				deferred.resolve(fulfillmentResult);
			}
		}

		function resolve(val){
			
			if(states.pending){
				value = val;
				_setState('fulfilled');
				fulfillmentHandler(value);
			}
			
		}
		
		function reject(reason){
			
			if(states.pending){
				value = reason;
				_setState('rejected');
				rejectionHandler(value);
			}
			
		}
		
		function then(onFulfilled, onRejected) {
			var deferred = President.defer()
			  , promise2 = deferred.promise;

			var fulHandler = fulfillmentHandler
			  , rejHandler = rejectionHandler
			  , ctchHandler = catchHandler;
			
			if(states.pending){
				
				rejectionHandler = currierFn(function (reason) {

					try {
						rejHandler && rejHandler(reason);
					} catch (err) {
						// catch?
					}

					try {
						rejectionResult = onRejected && onRejected.call && onRejected(value);
					} catch (err) {  // Promise A+ 2.2.7.2
						deferred.reject(err);
					}

					// Promise A+ 2.2.7.1
					if (!!rejectionResult) {
						deferred.reject(rejectionResult);
					} else if (!(onRejected && onRejected.call)) {  // Promise A+ 2.2.7.4
						deferred.reject(value);
					} else {
						deferred.reject(rejectionResult);
					}

				});
				
				fulfillmentHandler = currierFn(function (value) {
					fulHandler && fulHandler(value);
					_fulfill(onFulfilled, value, deferred);
				});
				
			} else if (!states.rejected) {
				_fulfill(onFulfilled, value, deferred);
			} else if (!states.fulfilled) {

				try {
					rejectionResult = onRejected && onRejected.call && onRejected(value);
				} catch (err) {  // Promise A+ 2.2.7.2
					deferred.reject(err);
				}

				// Promise A+ 2.2.7.1
				if (!!rejectionResult) {
					deferred.reject(rejectionResult);
				} else if (!(onRejected && onRejected.call)) {  // Promise A+ 2.2.7.4
					deferred.reject(value);
				} else {
					deferred.reject(rejectionResult);
				}

			}
			

			
			return promise2;
		}
		
		function catchException(err){
			
			if(states.pending){
				
			}
			
		}
		
		// export precepts
		this['[[PromiseStatus]]'] = 'pending';
		this['[[PromiseValue]]'] = null;
		this.then = then;
		this['catch'] = catchException;
		
		initializer(resolve, reject);
		return this;
	}
	
	return President;
})();