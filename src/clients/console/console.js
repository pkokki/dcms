angular.module('console', [
		'ui.router', 
		'ngMaterial',
		'ngMessages',
	])
	.config(['$stateProvider', '$urlRouterProvider', '$mdIconProvider', function ($stateProvider, $urlRouterProvider, $mdIconProvider) {
		
		$mdIconProvider.iconSet('core', '../assets/img/core-icons.svg', 24);
		
		$urlRouterProvider.otherwise('/');
		
		$stateProvider
			.state('app', {
				url: '/',
				templateUrl: 'home.html',
				controller: 'homeController'
			})
		;
	}])
	.service('tenantApiClient', ['$http', function($http) {
		var baseApiUri = '/api/tenants';
		
		var queryTenants = function(success, error) {
			$http.get(baseApiUri)
				.success(function(result) { success(result); })
				.error(function(result) { error(result); });
		};
		var createTenant = function(data, success, error) {
			$http.post(baseApiUri, data)
				.success(function(result) { success(result); })
				.error(function(result) { error(result); });
		};
		var deleteTenant = function(id, success, error) {
			$http.delete(baseApiUri + '/' + id)
				.success(function(result) { success(result); })
				.error(function(result) { error(result); });
		};
		
		var theService = {
			query: queryTenants,
			create: createTenant,
			delete: deleteTenant,
		};
		return theService;
	}])
	.controller('appController', ['$scope', '$mdSidenav', function($scope, $mdSidenav) {
		$scope.toggleMenu = function(id) {
			$mdSidenav(id).toggle();
		};
		console.info('Console started');
	}])
	.controller('homeController', ['$scope', 'tenantApiClient', function($scope, tenantApiClient) {
		tenantApiClient.query(
			function(tenants) {
				$scope.tenants = tenants;
			}, 
			function(data) {
			});
	}])
;
