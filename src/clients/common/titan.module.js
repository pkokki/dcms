angular.module('titan', [])
	.config([function() {}])
	.run([function() {}])
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
    ;
