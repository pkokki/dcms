angular.module('console', [
		'ui.router',
		'ngMaterial',
		'ngMessages',
		'atlas',
		'titan',
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
