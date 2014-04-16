var N = (function() {

	// pubsub for internal use
	var bus = (function() {
		var topics = {};
		var subUid = -1;
		var pubsub = {}
		pubsub.publish = function(topic, args) {
			if (!topics[topic]) {
				return false;
			}
			var subscribers = topics[topic],
				len = subscribers ? subscribers.length : 0;
			while (len--) {
				subscribers[len].func(topic, args);
			}
			return this;
		};
		pubsub.subscribe = function(topic, func) {
			if (!topics[topic]) {
				topics[topic] = [];
			}
			var token = (++subUid).toString();
			topics[topic].push({
				token: token,
				func: func
			});
			return token;
		};

		pubsub.unsubscribe = function(token) {
			for (var m in topics) {
				if (topics[m]) {
					for (var i = 0, j = topics[m].length; i < j; i++) {
						if (topics[m][i].token === token) {
							topics[m].splice(i, 1);
							return token;
						}
					}
				}
			}
			return this;
		};
		return pubsub;
	}());

	//begin loader

	var modules = {};

	function require(name) {
		return modules[name].exports;
	}

	function define(name, dependencies, factory) {
		var module = new Module(name, dependencies, factory);
		modules[name] = module;
		module.checkDependencies();
		for (var i = dependencies.length - 1; i >= 0; i--) {
			var moduleName = dependencies[i];
			if (!modules[moduleName]) {
				loadScript(name2path(moduleName));
				//module placeholder
				modules[moduleName] = {};
			}
		};
	}

	function name2path(moduleName){
		return '/'+moduleName+'.js';
	}

	function Module(name, dependencies, factory) {
		this.name = name;
		this.dependencies = dependencies;
		this.factory = factory;
		var self = this;
		var executed = false;
		bus.subscribe('module:ready', function(topics, data) {
			self.checkDependencies();
		})
	}

	Module.prototype.execute = function(require, exports) {
		if (this.executed) {
			return;
		}
		this.factory(require, exports);
		modules[this.name].exports = exports;
		this.executed = true;
		console.log('module executed: ' + this.name)
		bus.publish('module:ready', {
			name: this.name
		});
	}

	Module.prototype.checkDependencies = function() {
		for (var i = this.dependencies.length - 1; i >= 0; i--) {
			var dependency = this.dependencies[i];
			if (!modules[dependency] || !modules[dependency].exports) {
				return;
			}
		}
		this.execute(require, {});
	}

	function loadScript(url) {
		var s = document.createElement('script');
		s.type = 'text/javascript';
		s.async = true;
		s.src = url;
		var x = document.getElementsByTagName('head')[0];
		x.appendChild(s);
	}

	return {
		define: define
	}

})()