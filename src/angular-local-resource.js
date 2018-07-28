(function() {
	'use strict';

	angular
	.module('angular-local-resource', ["ng", "ngStorage"])
	.factory('$localResource', localResource);

	localResource.$inject = ["$q", "$localStorage"];

	function localResource($q, $localStorage){
		function ResourceFactory(resource, defaults){
			if(typeof $localStorage[resource] == "undefined"){
				for(let item of defaults){
					if(typeof item._id === "undefined") item._id = ObjectId();
				}
				$localStorage[resource] = defaults;
			}

			function Resource(value) {
				shallowClearAndCopy(value || {}, this);
			}

			function shallowClearAndCopy(src, dst) {
				dst = dst || {};

				angular.forEach(dst, function(value, key) {
					delete dst[key];
				});

				for (var key in src) {
					if (src.hasOwnProperty(key) && !(key.charAt(0) === '$' && key.charAt(1) === '$')) {
						dst[key] = src[key];
					}
				}

				return dst;
			}

			function ObjectId(){
				var m = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : Math;
				var d = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : Date;
				var h = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 16;
				var s = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : function (s) {
					return m.floor(s).toString(h);
				};
				return s(d.now() / 1000) + ' '.repeat(h).replace(/./g, function () {
					return s(m.random() * h);
				});
			}

			Resource.prototype.$save = function(){
				if (this._id) {
					return this.$update();
				}
				else {
					return this.$create();
				}
			}

			Resource.prototype.$create = function(){
				let self = this;
				return $q(function(resolve, reject){
					self._id = ObjectId();
					$localStorage[resource].push(self);
					resolve(self);
				});
			}

			Resource.prototype.$update = function(){
				let self = this;
				return $q(function(resolve, reject){
					let index = $localStorage[resource].findIndex(item => item._id === self._id);
					_.extend($localStorage[resource][index], self);
					resolve(self);
				});
			}

			Resource.prototype.$delete = function(){
				let self = this;
				return $q(function(resolve, reject){
					let index = $localStorage[resource].findIndex(item => item._id === self._id);
					$localStorage[resource].splice(index, 1);
					$localStorage[resource] = _.compact($localStorage[resource]);
					resolve();
				});
			}

			Resource.find = function(_id){
				return $q(function(resolve, reject){
					let data = $localStorage[resource];
					let instances = [];
					for(let item of data){
						instances.push(new Resource(item));
					}
					resolve(instances);
				});
			}

			return Resource;
		}

		return ResourceFactory;
	}
})();