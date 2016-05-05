var API_BASE = 'http://ridesharingfyp.ddns.net:3000/api';
angular.module('mainApp', ['ui.router', 'ngStorage', 'datatables', 'ui.bootstrap', 'ngResource', 'lbServices'])
.config(function($stateProvider, $urlRouterProvider, LoopBackResourceProvider){
    $urlRouterProvider.otherwise('/login');
    $stateProvider
    .state('login', {
        url: '/login',
        params: {danger:{}, msg:{}},
        templateUrl: 'templates/login.html',
        controller: 'loginCtrl'
    })
    .state('home', {
        url: '/home',
        templateUrl: 'templates/home.html',
        controller: 'homeCtrl'
    })
        .state('home.dashboard', {
            url: '/dashboard',
            templateUrl: 'templates/dashboard.html',
            controller: 'dashboardCtrl'
        })
        .state('home.ride', {
            url: '/ride',
            templateUrl: 'templates/ride.html',
            controller: 'rideCtrl'
        })
        .state('home.users', {
            url: '/users',
            templateUrl: 'templates/users.html',
            controller: 'usersCtrl'
        })
        .state('home.vehicle', {
            url: '/vehicle',
            params: {userId:{}},
            templateUrl: 'templates/vehicle.html',
            controller: 'vehicleCtrl'
        })
        .state('home.upload', {
            url: '/upload',
            templateUrl: 'templates/uploadExcel.html',
            controller: 'uploadCtrl'
        });
    // Use a custom auth header instead of the default 'Authorization'
    LoopBackResourceProvider.setAuthHeader('X-Access-Token');
    // Change the URL where to access the LoopBack REST API server
    LoopBackResourceProvider.setUrlBase(API_BASE);

})
.run(function($rootScope, $state, $localStorage) {
    $rootScope.$on('$stateChangeSuccess', function (evt, toState) {
        if (toState.name === 'home') {
            $state.go('.dashboard');
        }
    });
    $rootScope.src = new EventSource(API_BASE+'/Dashboards/change-stream?_format=event-stream');
    $localStorage.$default({
        accessToken: null
    });
})
.factory('TimeConverter', function(){
    return {
        getTimeString: function(date){
            var time = new Date(date);
            var hour = (time.getHours() < 10 ? "0" : "") + time.getHours();
            var minute = (time.getMinutes() < 10 ? "0" : "") + time.getMinutes();
            var second = (time.getSeconds() < 10 ? "0" : "") + time.getSeconds();
            var day = (time.getDate() < 10 ? "0" : "") + time.getDate();
            var month = ((time.getMonth()+1) < 10 ? "0" : "") + (time.getMonth()+1);
            var year = (time.getFullYear() < 10 ? "0" : "") + time.getFullYear();
            return year+"/"+month+"/"+day+" "+hour+":"+minute+":"+second;
        }
    }
})
.factory("XLSXReaderService", ['$q', '$rootScope',
    function($q, $rootScope) {
        var service = function(data) {
            angular.extend(this, data);
        }

        service.readFile = function(file, readCells, toJSON) {
            var deferred = $q.defer();

            XLSXReader(file, readCells, toJSON, function(data) {
                $rootScope.$apply(function() {
                    deferred.resolve(data);
                });
            });

            return deferred.promise;
        }

        return service;
    }
])

// Controllers

.controller('loginCtrl', function($scope, $state, $localStorage, $stateParams, Admin){

    $localStorage.accessToken = null;
    $scope.alertInfo = $stateParams;

    $scope.login = function(data){
        if (data && data.username && data.password){
            Admin.login(data, function(value, responseheaders){
                $localStorage.accessToken = value.id;
                $state.go('home');
            }, function(error){
                $state.go('login', {danger: true, msg: (error.data? 'Incorrect Username or Password': 'No response from the Admin Panel!')});
            });
        }
    };

})
.controller('homeCtrl', function($scope, $state, $localStorage, Admin){

    $scope.loginCheck = function(){
        if (!$localStorage.accessToken){
            $state.go('login', {danger: true, msg: 'You are required to login before accessing the page.'});
        }
    };

    $scope.logout = function(){
        Admin.logout({}, function(value, responseheaders){
            $localStorage.accessToken = null;
            $state.go('login', {danger: false, msg: 'You have successfully logged out of the Admin Panel.'});
        }, function(error){
            $state.go('login', {danger: true, msg: (error.data? error.data.error.message: 'No response from the Admin Panel!')});
        });
    };

})
.controller('dashboardCtrl', function($scope, $state, $rootScope, Admin){

    $rootScope.src.removeEventListener('data', $rootScope.dashboardUpdate);
    $rootScope.dashboardUpdate = function(value) {
        var data = JSON.parse(value.data).data;
        $scope.$apply($scope.updateDashboard(data));
    }
    $rootScope.src.addEventListener('data', $rootScope.dashboardUpdate);

    $scope.updateDashboard = function(data){
        // console.log(data);
        if (data.memCount != null){
            $scope.memCount = data.memCount;
        }
        if (data.rideCount != null){
            $scope.rideCount = data.rideCount;
        }
        if (data.requestCount != null){
            $scope.requestCount = data.requestCount;
        }
        if (data.joinCount != null){
            $scope.joinCount = data.joinCount;
        }
        if (data.pastOffers != null && data.pastRequests != null){
            $scope.updateOfferRequestChart(data.pastOffers, data.pastRequests);
        }
        if ((data.driverCount != null && $scope.driverCount != data.driverCount) || 
            (data.passengerCount != null && $scope.passengerCount != data.passengerCount)){
            $scope.driverCount = data.driverCount;
            $scope.passengerCount = data.passengerCount;
            $scope.usersData = [
                {value: $scope.driverCount, label: "Drivers"},
                {value: $scope.passengerCount, label: "Passengers"},
            ];
            $scope.charts[1].setData($scope.usersData);
        }
        if ((data.maleCount != null && $scope.maleCount != data.maleCount) || 
            (data.femaleCount != null && $scope.femaleCount != data.femaleCount)){
            $scope.maleCount = data.maleCount;
            $scope.femaleCount = data.femaleCount;
            $scope.users2Data = [
                {value: $scope.maleCount, label: "Male"},
                {value: $scope.femaleCount, label: "Female"},
            ];
            $scope.charts[2].setData($scope.users2Data);
        }
        $scope.totalMemCount = $scope.maleCount + $scope.femaleCount;
        if (data.timeline != null){
            $scope.events = data.timeline;
        }
    };

    $scope.updateOfferRequestChart = function(pastOffers, pastRequests){
        var equal = true;
        if ($scope.pastOffers == null || $scope.pastRequests == null){
            $scope.createCharts();
            equal = false;
        } else{
            equal = $scope.pastOffers.every(function(element, index){
                    return element === pastOffers[index];
                }) && $scope.pastRequests.every(function(element, index){
                    return element === pastRequests[index];
                });
        }
        if (!equal){
            $scope.offerRequestData = [];
            $scope.pastOffers = pastOffers;
            $scope.pastRequests = pastRequests;
            var today = new Date();
            var oneDay = 24*60*60*1000;
            for (var i=7; i>0; i--){
                var currDay = new Date(today-i*oneDay);
                $scope.offerRequestData.push({
                    "Date": currDay.getDate()+"/"+(currDay.getMonth()+1),
                    "Offer": $scope.pastOffers[7-i],
                    "Request": $scope.pastRequests[7-i]
                });
            }
            $scope.charts[0].setData($scope.offerRequestData);
        }
    }

    $scope.createCharts = function(offerRequestData, usersData, users2Data){
        if (offerRequestData == null || offerRequestData.length <= 0){
            offerRequestData = [{Date: '', Offer: 0, Request: 0}];
        }
        if (usersData == null){
            usersData = [{label: '', value: 0}];
        }
        if (users2Data == null){
            users2Data = [{label: '', value: 0}];
        }
        $scope.charts = [];
        $scope.charts.push(
            Morris.Bar({
                element: 'offerRequestChart',
                data: offerRequestData,
                xkey: 'Date',
                ykeys: ['Offer', 'Request'],
                labels: ['Offer', 'Request'],
                hideHover: 'auto',
                smooth: false,
                resize: true
            })
        );
        $scope.charts.push(
            Morris.Donut({
                element: 'usersChart',
                data: usersData,
                colors: ['#0ba462', '#337ab7'],
                resize: true
            })//.select(0);
        );
        $scope.charts.push(
            Morris.Donut({
                element: 'users2Chart',
                data: users2Data,
                colors: ['#337ab7', '#d9534f'],
                resize: true
            })
        );
    };

    Admin.adminDashBoard(function(value, responseheaders){
        if (!value.status){
            $state.go('login', {danger: true, msg: 'You are required to login before accessing the page.'});
        }
    }, function(error){
        $state.go('login', {danger: true, msg: (error.data? error.data.error.message: 'No response from the Admin Panel!')});
    });

}).controller('rideCtrl', function($scope, DTOptionsBuilder, DTColumnDefBuilder, Admin, Ride, Request, TimeConverter){

    $scope.dtOptions = DTOptionsBuilder.newOptions().withPaginationType('simple').withOption('responsive', true);
    $scope.dtColumnDefs1 = [
        DTColumnDefBuilder.newColumnDef(0).withOption('width', '7%'),
        DTColumnDefBuilder.newColumnDef(1).withOption('width', '10%'),
        DTColumnDefBuilder.newColumnDef(4).withOption('width', '10%'),
        DTColumnDefBuilder.newColumnDef(6).withOption('width', '10%'),
        DTColumnDefBuilder.newColumnDef(7).withOption('width', '16%'),
        DTColumnDefBuilder.newColumnDef(8).withOption('width', '10%')
    ];
    $scope.dtColumnDefs2 = [
        DTColumnDefBuilder.newColumnDef(0).withOption('width', '7%'),
        DTColumnDefBuilder.newColumnDef(2).withOption('width', '15%'),
        DTColumnDefBuilder.newColumnDef(3).withOption('width', '15%'),
        DTColumnDefBuilder.newColumnDef(4).withOption('width', '10%'),
        DTColumnDefBuilder.newColumnDef(5).withOption('width', '16%'),
        DTColumnDefBuilder.newColumnDef(6).withOption('width', '10%')
    ];
    $scope.dtColumnDefs3 = [
        DTColumnDefBuilder.newColumnDef(0).withOption('width', '7%'),
        DTColumnDefBuilder.newColumnDef(5).withOption('width', '16%'),
        DTColumnDefBuilder.newColumnDef(6).withOption('width', '10%')
    ];

    $scope.offers = [];
    $scope.requests = [];
    $scope.joins = [];

    Admin.adminGetRide(function(value, responseheaders){
        $scope.offers = value.status;
        $scope.offers.forEach(function(offer){
            offer.ctime = TimeConverter.getTimeString(offer.time);
        });
    });

    Admin.adminGetRequest(function(value, responseheaders){
        $scope.requests = value.status;
        $scope.requests.forEach(function(request){
            request.ctime = TimeConverter.getTimeString(request.time);
        });
    });

    Admin.adminGetJoin(function(value, responseheaders){
        $scope.joins = value.status;
        $scope.joins.forEach(function(join){
            join.ctime = TimeConverter.getTimeString(join.time);
        });
    });

    $scope.cancelRide = function(id, destination){
        Ride.cancelRide({"rideId": id, "leaveUst": (destination!="HKUST")}, function(value, responseheaders){
            alert(value.status);
        });
    }

    $scope.cancelRequest = function(id, destination){
        Request.cancelMatch({"requestId": id, "leaveUst": (destination!="HKUST")}, function(value, responseheaders){
            alert(value.status);
        });
    }

}).controller('usersCtrl', function($scope, $state, DTOptionsBuilder, DTColumnDefBuilder, Admin, TimeConverter){

    $scope.dtOptions = DTOptionsBuilder.newOptions().withPaginationType('simple').withOption('responsive', true);
    $scope.dtColumnDefs = [
        DTColumnDefBuilder.newColumnDef(7).withOption('width', '16%'),
        DTColumnDefBuilder.newColumnDef(8).withOption('width', '10%')
    ];

    $scope.newUser = {};
    $scope.users = [];
    $scope.cars = [];

    Admin.adminGetMember(function(value, responseheaders){
        $scope.users = value.status;
        $scope.users.forEach(function(user){
            user.status = (user.authorized == "yes") ? "Authorized" : "Unauthorized";
            user.created = TimeConverter.getTimeString(user.created);
            user.password = "******";
        });
    });

    Admin.adminGetOwnership(function(value, responseheaders){
        $scope.cars = value.status;
        $scope.cars.forEach(function(car){
            car.id = car.memberId;
        });
    });

    $scope.editingData = {};
    for (var i = 0, length = $scope.users.length; i < length; i++) {
      $scope.editingData[$scope.users[i].id] = false;
    }

    $scope.modify = function(user){
        $scope.editingData[user.id] = true;
    };

    $scope.update = function(user){
        var data = {};
        data.id = user.id;
        data.email = user.email;
        if (user.password != "******"){
            data.password = user.password;
        }
        data.gender = user.gender;
        data.phone_number = user.phone_number;
        data.authorized = (user.status == "Authorized") ? "yes" : "no";
        data.emailVerified = (user.status == "Authorized") ? "1" : null;
        Admin.adminChange(data, function(value, responseheaders){
            $scope.editingData[user.id] = false;
            alert("User information updated!");
            $state.go($state.current, {}, {reload: true});
        });
    };

    $scope.remove = function(user){
        Admin.adminRemoveRecord({item: "User", info: {id: user.id}}, function(value, responseheaders){
            alert("Member record removed!");
            $state.go($state.current, {}, {reload: true});
        })
    }

    $scope.goToVehicle = function(id){
        $state.go('home.vehicle', {userId: (id+"")});
    }

    $scope.add = function(user){
        var data = user;
        data.created = new Date();
        if (data.authorized == "yes"){
            data.emailVerified = 1;
        }
        Admin.addMember(data, function(value, responseheaders){
            alert("Member record created!");
            //$state.go($state.current, {}, {reload: true});
            history.go(0);
        });
    }

}).controller('vehicleCtrl', function($scope, $stateParams, $state, DTOptionsBuilder, DTColumnDefBuilder, Vehicle, Admin, Own){

    $scope.dtOptions = DTOptionsBuilder.newOptions().withPaginationType('simple').withOption('responsive', true);
    $scope.dtColumnDefs1 = [
        DTColumnDefBuilder.newColumnDef(3).withOption('width', '18%')
    ];
    $scope.dtColumnDefs2 = [
        DTColumnDefBuilder.newColumnDef(2).withOption('width', '18%')
    ];

    $scope.registers = Vehicle.find({});
    $scope.owns = [];
    $scope.newReg = {};
    $scope.newOwn = {};
    $scope.newOwn.id = typeof($stateParams.userId) == "string" ? $stateParams.userId : "";

    Admin.adminGetOwnership(function(value, responseheaders){
        $scope.owns = value.status;
    });
    
    $scope.editingRegData = {};
    $scope.editingOwnData = {};
    
    for (var i = 0, length = $scope.registers.length; i < length; i++) {
      $scope.editingRegData[$scope.registers[i].license_number] = false;
    }
    for (var i = 0, length = $scope.owns.length; i < length; i++) {
      $scope.editingOwnData[$scope.owns[i].id] = false;
    }
    
    $scope.modifyReg = function(register){
        $scope.editingRegData[register.license_number] = true;
    };

    $scope.updateReg = function(register){
        var data = {};
        data.id = register.id;
        data.license_number = register.license_number;
        data.color = register.color;
        data.maker = register.maker;
        Vehicle.prototype$updateAttributes(data);
        $scope.editingRegData[register.license_number] = false;
        alert("Vehicle updated!");
    };
    
    $scope.modifyOwn = function(own){
        $scope.editingOwnData[own.id] = true;
    };

    $scope.updateOwn = function(own){
        Vehicle.find({filter: {where: {license_number: own.license_number}}}, function(value, responseheaders){
            if (value.length > 0){
                var data = {};
                data.id = own.id;
                data.memberId = own.memberId;
                data.vehicleId = value.id;
                Own.prototype$updateAttributes(data);
                $scope.editingOwnData[own.id] = false;
                alert("Ownership updated!");
            } else{
                var car = {};
                car.license_number = own.license_number;
                car.maker = "";
                car.color = "";
                $scope.addReg(car, false, function(){
                    Vehicle.findOne({filter: {where: {license_number: own.license_number}}}, function(value, responseheaders){
                        var data = {};
                        data.id = own.id;
                        data.memberId = own.memberId;
                        data.vehicleId = value.id;
                        console.log(data);
                        Own.prototype$updateAttributes(data);
                        $scope.editingOwnData[own.id] = false;
                        alert("Ownership updated!");
                        history.go(0);
                    });
                });
            }
        });
        
    };

    $scope.removeReg = function(register){
        Admin.adminRemoveRecord({item: "Vehicle", info: {id: register.id}}, function(value, responseheaders){
            alert("Vehicle record removed!");
            $state.go($state.current, {}, {reload: true});
        });
    }

    $scope.removeOwn = function(own){
        Admin.adminRemoveRecord({item: "Own", info: {id: own.id}}, function(value, responseheaders){
            alert("Ownership record removed!");
            $state.go($state.current, {}, {reload: true});
        });
    }

    $scope.addReg = function(register, refresh, cb){
        var data = {};
        data.memberId = -1;
        data.car = register;
        Admin.adminAddVehicle(data, function(value, responseheaders){
            if (refresh){
                //$state.go($state.current, {userId: $scope.newOwn.id}, {reload: true});
                alert("Vehicle added!");
                history.go(0);
            }
            if (cb != null){
                cb();
            }
        });
    }

    $scope.addOwn = function(own){
        var data = {};
        var car = {};
        car.license_number = own.license_number;
        car.maker = "";
        car.color = "";
        data.memberId = own.id;
        data.car = car;
        Admin.adminAddVehicle(data, function(value, responseheaders){
            alert("Ownership added!");
            //$state.go($state.current, {userId: $scope.newOwn.id}, {reload: true});
            history.go(0);
        });
    }

}).controller('uploadCtrl', function($scope, $state, XLSXReaderService, Admin){

    $scope.showPreview = false;
    $scope.showJSONPreview = true;
    $scope.json_string = "";

    $scope.fileChanged = function(files) {
        $scope.isProcessing = true;
        $scope.sheets = [];
        $scope.excelFile = files[0];
        XLSXReaderService.readFile($scope.excelFile, $scope.showPreview, $scope.showJSONPreview).then(function(xlsxData) {
            $scope.sheets = xlsxData.sheets;
            $scope.isProcessing = false;
        });
    }

    $scope.updateJSONString = function() {
        $scope.json_string = JSON.stringify($scope.sheets[$scope.selectedSheetName], null, 2);
    }

    $scope.showPreviewChanged = function() {
        if ($scope.showPreview) {
            $scope.showJSONPreview = false;
            $scope.isProcessing = true;
            XLSXReaderService.readFile($scope.excelFile, $scope.showPreview, $scope.showJSONPreview).then(function(xlsxData) {
                $scope.sheets = xlsxData.sheets;
                $scope.isProcessing = false;
            });
        }
    }

    $scope.uploadClick = function(){
        var jsonString = JSON.parse($scope.json_string);
        Admin.adminMassImport(jsonString, function(value, responseheaders){
            if (value.status == "success"){
                alert("Member records are created successfully!");
                $state.go('home.users');
            } else{
                alert("Fail to create member records! Please check the file again.");
                $state.go($state.current, {}, {reload: true});
            }            
        });
    }
});


