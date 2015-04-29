angular.module('studio', [
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
				controller: 'homeController',
				allowAnonymous: true
			})
			.state('register', {
				url: '/register',
				templateUrl: 'register.html',
				controller: 'registerController',
				allowAnonymous: true
			})
			.state('registerThanks', {
				url: '/registerThanks',
				template: '<h1>Thank you!</h1><p>You will receive a message with further info after registration approval.</p><p><a href="#/home">Home</a></p>',
				allowAnonymous: true
			})
			.state('signin', {
				url: '/signin',
				templateUrl: 'signin.html',
				controller: 'signinController',
				allowAnonymous: true
			})
			.state('forgotPassword', {
				url: '/forgotPassword',
				templateUrl: 'forgotPassword.html',
				controller: 'forgotPasswordController',
				allowAnonymous: true
			})
			.state('dashboard', {
				url: '/dashboard',
				templateUrl: 'dashboard.html',
				controller: 'dashboardController'
			})
			.state('userProfile', {
				url: '/userProfile',
				templateUrl: 'userProfile.html',
				controller: 'userProfileController'
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
		var tenant = null;
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
					$state.go('dashboard');
				}
			},
			setTenant: function(data) {
				tenant = data;
			},
			isSignedOn: function() {
				return tenant != null;
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
		var theService = {
			getTenant: getTenant,
			registerTenant: registerTenant,
		};
		return theService;
	}])
	.factory('tenantSigninService', ['$q', 'tenantService', function($q, tenantService) {
		var theService = {
			signin: function(credentials) {
				return $q(function(resolve, reject) {
					if (credentials && credentials.email && credentials.password) {
						tenantService.getTenant(credentials.email).then(function(tenant) {
							if (tenant)
								resolve(tenant);
							else
								reject('tenant not found');
						}, function(data) {
							reject('error getting tenant');
						});
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
			$state.go('dashboard');
		};
		$scope.hasUser = spa.isSignedOn;

		$scope.goUserProfile = function() {
			$state.go('userProfile');
		};
		$scope.toggleMenu = function(id) {
			$mdSidenav(id).toggle();
		};
		console.info('Studio started');
	}])
	.controller('homeController', [function() {}])
	.controller('registerController', ['$scope', '$state', 'tenantService', function($scope, $state, tenantService) {
		$scope.register = function(tenantData) {
			tenantService.registerTenant(tenantData)
				.then(function(data) { 
					$state.go('registerThanks');
				}, function(data) { 
					$scope.errorMsg = data;
				});
		};
		$scope.registerWithGoogle = function() {
			console.warn('registerController.registerWithGoogle: Not implemented!');
		};
	}])
	.controller('signinController', ['$scope', '$state', 'spa', 'tenantSigninService', function($scope, $state, spa, tenantSigninService) {
		$scope.signin = function(credentials) {
			tenantSigninService.signin(credentials).then(function(tenant) {
				spa.setTenant(tenant);
				spa.resumeRoute();
			}, function(data) {
				$scope.errorMsg = data;
			});
		};
		$scope.googleSignin = function() {
			console.warn('signinController.googleSignin: Not implemented!');
		};
	}])
	.controller('forgotPasswordController', [function() {}])
	.controller('dashboardController', [function() {}])
	.controller('userProfileController', [function() {}])
;
