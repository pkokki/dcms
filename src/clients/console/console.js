angular.module('console', [
	'ui.router', 
	'ngMaterial',
	'ngMessages',
]);

function mainController($scope, $http) {
	$scope.formData = {};
	
	$http.get('/api/tenants')
		.success(function(data) {})
		.error(function(data) {});
		
	$scope.createTenant = function() {
		$http.post('/api/tenants', $scope.formData)
			.success(function(data) {
				$scope.formData = {};
			})
			.error(function(data) {});
	};
	
	$scope.deleteTenant = function(id) {
		$http.delete('/api/tenants/' + id)
			.success(function(data) {})
			.error(function(data) {
				console.log('Error: ' + data);
			});
	};
}