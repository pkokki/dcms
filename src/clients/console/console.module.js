angular.module('console', [
		'ui.router',
		'ngMaterial',
		'ngMessages',
		'atlas',
	])
	.config(['$stateProvider', '$urlRouterProvider', '$mdIconProvider', function ($stateProvider, $urlRouterProvider, $mdIconProvider) {

		$mdIconProvider.iconSet('core', '../assets/img/core-icons.svg', 24);

		$urlRouterProvider.otherwise('/');

		$stateProvider
			.state('home', {
				url: '/',
				templateUrl: 'home.html',
				controller: 'homeController'
			})
			.state('signin', {
				url: '/signin',
				templateUrl: 'signin.html',
				controller: 'signinController',
				allowAnonymous: true
			})
			.state('tenants', {
				url: '/tenants',
				templateUrl: 'tenants.html',
				controller: 'tenantsController'
			})
			.state('tenantSettings', {
				url: '/tenantSettings/:id',
				templateUrl: 'tenantSettings.html',
				controller: 'tenantSettingsController'
			})
		;
	}])
	.run(['$rootScope', '$state', 'spa', function ($rootScope, $state, spa) {
		$rootScope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams) {
			if (!spa.isSignedOn() && toState.name != 'signin' && !toState.allowAnonymous) {
				spa.suspendRoute(toState, toParams);
				$state.go('signin');
				event.preventDefault();
			}
		});
	}])
	.factory('spa', ['$state', function($state) {
		var toRoute = null;
		var user = null;
		return {
			suspendRoute: function(toState, toParams) {
				toRoute = {
					state: toState,
					params: toParams
				};
			},
			resumeRoute: function() {
				if (toRoute) {
					$state.go(toRoute.state, toRoute.params);
					toRoute = null;
				}
				else {
					$state.go('home');
				}
			},
			setUser: function(data) {
				user = data;
			},
			isSignedOn: function() {
				// #DEV_ONLY
				if (user == null) user = { username: 'admin' };
				return user != null;
			},
		};
	}])
	.factory('tenantService', ['$q', function($q) {
		var maxTenantId = 3;
		var tenants = [
			{ id: 1, username: 'relational', firstname: 'Panos', lastname: 'Kokkinidis', company: 'Relational SA', email: 'relational@example.com', active: true, admin: true },
			{ id: 2, username: 'cententia', firstname: 'Panos', lastname: 'Psomas', company: 'Cententia SA', email: 'cententia@example.com', active: false },
			{ id: 3, username: 'var1', company: 'VAR1 Ltd', email: 'john@var.com', active: true },
		];

		var pageTenants = function(page, pageSize) {
			page = page || 1;
			pageSize = pageSize || 10;
			return $q(function(resolve, reject) {
				resolve({
					Page: page,
					NumPages: Math.floor(tenants.length / pageSize) + 1,
					PageSize: pageSize,
					Total: tenants.length,
					Start: (page - 1) * pageSize,
					End: tenants.length ? (page * pageSize < tenants.length ? page * pageSize - 1 : tenants.length - 1) : 0,
					Items: tenants,
				});
			});
		};
		var getTenant = function(id) {
			return $q(function(resolve, reject) {
				var tenant = null;
				for (var i=0; i<tenants.length; i++) {
					if (tenants[i].id == id) {
						tenant = tenants[i];
						break;
					}
				}
				resolve(tenant);
			});
		};
		var registerTenant = function(tenantData) {
			return $q(function(resolve, reject) {
				tenantData.id = ++maxTenantId;
				tenantData.active = false;
				tenants.push(tenantData);
				resolve(tenantData);
			});
		};
		var activateTenant = function(id) {
			return $q(function(resolve, reject) {
				getTenant(id).then(function(tenant) {
					if (tenant != null) {
						tenant.active = true;
						resolve(tenant);
					}
					else {
						reject('Tenant not exists.');
					}
				});
			});
		};
		var deactivateTenant = function() {
			return $q(function(resolve, reject) {
				getTenant(id).then(function(tenant) {
					if (tenant != null) {
						tenant.active = false;
					}
					resolve(tenant);
				});
			});
		};
		var theService = {
			pageTenants: pageTenants,
			getTenant: getTenant,
			registerTenant: registerTenant,
			activateTenant: activateTenant,
			deactivateTenant: deactivateTenant,
		};
		return theService;
	}])
	.factory('signinService', ['$q', function($q) {
		var theService = {
			signin: function(credentials) {
				return $q(function(resolve, reject) {
					if (credentials && credentials.username) {
						var user = {
							username: credentials.username
						};
						resolve(user);
					}
					else {
						reject('invalid credentials');
					}
				});
			},
		};
		return theService;
	}])
	.controller('appController', ['$scope', '$mdSidenav', '$state', 'spa', function($scope, $mdSidenav, $state, spa) {
		$scope.goHome = function() {
			$state.go('home');
		};
		$scope.hasUser = spa.isSignedOn;

		$scope.toggleMenu = function(id) {
			$mdSidenav(id).toggle();
		};
		console.info('Console started');
	}])
	.controller('homeController', [function() {}])
	.controller('signinController', ['$scope', 'spa', 'signinService', function($scope, spa, signinService) {
		$scope.signin = function(credentials) {
			signinService.signin(credentials).then(function(tenant) {
				spa.setUser(tenant);
				spa.resumeRoute();
			}, function(data) {
				$scope.errorMsg = data;
			});
		};
		$scope.googleSignin = function() {
			console.warn('signinController.googleSignin: Not implemented!');
		};
	}])
	.controller('tenantsController', ['$scope', 'tenantService', function($scope, tenantService) {
		tenantService.pageTenants().then(function(data){
			$scope.data = data;
		}, function(err) {
			console.log('tenantsController.ERROR', err);
		});

		$scope.selectFlags = [];
		$scope.toggleSelection = function(index) {
			console.log(index, $scope.selectFlags);
		}
	}])
	.controller('tenantSettingsController', ['$scope', 'tenantService', function($scope, tenantService) {
		
	}])

;
