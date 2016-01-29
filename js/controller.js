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
    $rootScope.dashboardListener = null;
    $localStorage.$default({
        accessToken: null
    });
})

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

    // $scope.events = [
    //     {type:'Offer', username:'user4', time:'11 mins ago', from:'HKUST', to:'Choi Hung'},
    //     {type:'Request', username:'user7', time:'23 mins ago', from:'Hang Hau', to:'HKUST'},
    //     {type:'Request', username:'user12', time:'47 mins ago', from:'HKUST', to:'Choi Hung'},
    //     {type:'Offer', username:'user2', time:'1 hour ago', from:'HKUST', to:'Hang Hau'},
    //     {type:'Request', username:'user5', time:'1 hour ago', from:'Sai Kung', to:'HKUST'},
    // ];

    if ($rootScope.dashboardListener == null){
        var src = new EventSource(API_BASE+'/Dashboards/change-stream?_format=event-stream');
        $rootScope.dashboardListener = src.addEventListener('data', function(msg) {
            var data = JSON.parse(msg.data).data;
            $scope.updateDashboard(data);
        });
    }

    $scope.updateDashboard = function(data){
        console.log(data);
        $scope.$apply(function(){
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
        });
    };

    $scope.updateOfferRequestChart = function(pastOffers, pastRequests){
        var equal = true;
        for (var i=0; i<7; i++){
            if ($scope.pastOffers[i] != pastOffers[i] || $scope.pastRequests[i] != pastRequests[i]){
                equal = false;
                break;
            }
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
            console.log($scope.offerRequestData);
            $scope.charts[0].setData($scope.offerRequestData);
        }
    }

    $scope.createCharts = function(offerRequestData, usersData, users2Data){
        var charts = [];
        charts.push(
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
        charts.push(
            Morris.Donut({
                element: 'usersChart',
                data: usersData,
                colors: ['#0ba462', '#337ab7'],
                resize: true
            })//.select(0);
        );
        charts.push(
            Morris.Donut({
                element: 'users2Chart',
                data: users2Data,
                colors: ['#337ab7', '#d9534f'],
                resize: true
            })
        );
        return charts;
    };

    Admin.adminDashBoard(function(value, responseheaders){
        var data = value.status;
        if (data){
            $scope.memCount = data.memCount;
            $scope.rideCount = data.rideCount;
            $scope.requestCount = data.requestCount;
            $scope.joinCount = data.joinCount;
            $scope.totalMemCount = data.maleCount + data.femaleCount;
            $scope.passengerCount = data.passengerCount;
            $scope.driverCount = data.driverCount;
            $scope.maleCount = data.maleCount;
            $scope.femaleCount = data.femaleCount;
            $scope.offerRequestData = [];
            $scope.pastOffers = [];
            $scope.pastRequests = [];
            var today = new Date();
            var oneDay = 24*60*60*1000;
            for (var i=7; i>0; i--){
                var currDay = new Date(today-i*oneDay);
                var nextDay = new Date(currDay.getTime()+oneDay);
                $scope.pastOffers.push(data[currDay.getDate()+"between_rideCount"+nextDay.getDate()]);
                $scope.pastRequests.push(data[currDay.getDate()+"between_requestCount"+nextDay.getDate()]);
                $scope.offerRequestData.push({
                    "Date": currDay.getDate()+"/"+(currDay.getMonth()+1),
                    "Offer": $scope.pastOffers[$scope.pastOffers.length-1],
                    "Request": $scope.pastRequests[$scope.pastRequests.length-1]
                });
            }
            $scope.usersData = [
                {value: $scope.driverCount, label: "Drivers"},
                {value: $scope.passengerCount, label: "Passengers"},
            ];
            $scope.users2Data = [
                {value: $scope.maleCount, label: "Male"},
                {value: $scope.femaleCount, label: "Female"},
            ];
            $scope.charts = $scope.createCharts($scope.offerRequestData, $scope.usersData, $scope.users2Data);
        } else{
            $state.go('login', {danger: true, msg: 'You are required to login before accessing the page.'});
        }
    }, function(error){
        $state.go('login', {danger: true, msg: (error.data? error.data.error.message: 'No response from the Admin Panel!')});
    });

}).controller('rideCtrl', function($scope, DTOptionsBuilder, DTColumnDefBuilder){

    $scope.dtOptions = DTOptionsBuilder.newOptions().withPaginationType('simple').withOption('responsive', true);
    $scope.dtColumnDefs1 = [
        DTColumnDefBuilder.newColumnDef(6).withOption('width', '15%'),
        DTColumnDefBuilder.newColumnDef(7).withOption('width', '15%')
    ];
    $scope.dtColumnDefs2 = [
        DTColumnDefBuilder.newColumnDef(5).withOption('width', '15%'),
        DTColumnDefBuilder.newColumnDef(6).withOption('width', '15%')
    ];
    $scope.dtColumnDefs3 = [
        DTColumnDefBuilder.newColumnDef(5).withOption('width', '15%')
    ];

    $scope.offers = [
        {id:'4', username:'user4', initLoc:'HKUST', destination:'Choi Hung', availableSeats: '3', genderPref:'-', timestamp:'2015/10/25 06:48'},
        {id:'2', username:'user2', initLoc:'HKUST', destination:'Hang Hau', availableSeats: '2', genderPref:'F', timestamp:'2015/10/26 13:24'},
    ];

    $scope.requests = [
        {id:'7', username:'user7', initLoc:'Hang Hau', destination:'HKUST', genderPref:'-', timestamp:'2015/10/25 07:08'},
        {id:'12', username:'user12', initLoc:'HKUST', destination:'Choi Hung', genderPref:'F', timestamp:'2015/10/27 12:54'},
        {id:'5', username:'user5', initLoc:'Sai Kung', destination:'HKUST', genderPref:'M', timestamp:'2015/10/29 09:23'},
    ];

    $scope.joins = [
        {driverId:'7', memberId:'1', timestamp:'2015/10/25 07:08', match_icon:'icon_001.png', finished:'Y'},
        {driverId:'3', memberId:'2', timestamp:'2015/10/27 12:54', match_icon:'icon_002.png', finished:'Y'},
    ];
    console.log($scope.joins);

}).controller('usersCtrl', function($scope, DTOptionsBuilder, DTColumnDefBuilder){

    $scope.dtOptions = DTOptionsBuilder.newOptions().withPaginationType('simple').withOption('responsive', true);
    $scope.dtColumnDefs = [
        DTColumnDefBuilder.newColumnDef(7).withOption('width', '15%'),
        DTColumnDefBuilder.newColumnDef(8).withOption('width', '15%')
    ];

    $scope.users = [
        {id:'0', username:'admin', password:'adminpwd', phone:'1234 5678', gender:'M', status:'Authorized', regdate:'2015/09/24 12:08'},
        {id:'1', username:'user', password:'userpwd', phone:'1234 5678', gender:'F', status:'Authorized', regdate:'2015/10/16 23:47'},
        {id:'2', username:'user1', password:'userpwd1', phone:'1234 5678', gender:'M', status:'Authorized', regdate:'2015/10/16 23:47'},
        {id:'3', username:'user2', password:'userpwd2', phone:'1234 5678', gender:'M', status:'Authorized', regdate:'2015/10/17 13:45'},
        {id:'4', username:'user3', password:'userpwd3', phone:'1234 5678', gender:'F', status:'Unauthorized', regdate:'2015/10/18 22:47'},
        {id:'5', username:'user4', password:'userpwd4', phone:'1234 5678', gender:'M', status:'Authorized', regdate:'2015/10/19 23:37'},
        {id:'6', username:'user5', password:'userpwd5', phone:'1234 5678', gender:'M', status:'Unauthorized', regdate:'2015/10/20 20:44'},
        {id:'7', username:'user6', password:'userpwd6', phone:'1234 5678', gender:'F', status:'Authorized', regdate:'2015/10/21 23:47'},
        {id:'8', username:'user7', password:'userpwd7', phone:'1234 5678', gender:'F', status:'Authorized', regdate:'2015/10/22 15:46'},
        {id:'9', username:'user8', password:'userpwd8', phone:'1234 5678', gender:'F', status:'Authorized', regdate:'2015/10/23 23:48'},
        {id:'10', username:'user9', password:'userpwd9', phone:'1234 5678', gender:'M', status:'Authorized', regdate:'2015/10/24 14:27'},
        {id:'11', username:'user10', password:'userpwd10', phone:'1234 5678', gender:'M', status:'Authorized', regdate:'2015/10/25 23:17'},
        {id:'12', username:'user11', password:'userpwd11', phone:'1234 5678', gender:'F', status:'Authorized', regdate:'2015/10/26 18:47'},
        {id:'13', username:'user12', password:'userpwd12', phone:'1234 5678', gender:'F', status:'Authorized', regdate:'2015/10/27 06:14'},
        {id:'14', username:'user13', password:'userpwd13', phone:'1234 5678', gender:'M', status:'Authorized', regdate:'2015/10/28 02:05'},
    ];

    $scope.cars = [
        {id:'2', license_number:'GG404', color:'blue', maker:'Benz'},
        {id:'5', license_number:'GG504', color:'red', maker:'Benz'},
        {id:'7', license_number:'GG604', color:'grey', maker:'Benz'},
        {id:'10', license_number:'GG704', color:'black', maker:'Benz'},
        {id:'7', license_number:'GG404', color:'black', maker:'Benz'},
    ];
    
    $scope.editingData = {};
    
    for (var i = 0, length = $scope.users.length; i < length; i++) {
      $scope.editingData[$scope.users[i].id] = false;
    }
    
    $scope.modify = function(user){
        $scope.editingData[user.id] = true;
    };

    $scope.update = function(user){
        $scope.editingData[user.id] = false;
    };

}).controller('rideCtrl', function($scope, DTOptionsBuilder, DTColumnDefBuilder){

    $scope.dtOptions = DTOptionsBuilder.newOptions().withPaginationType('simple').withOption('responsive', true);
    $scope.dtColumnDefs1 = [
        DTColumnDefBuilder.newColumnDef(6).withOption('width', '15%'),
        DTColumnDefBuilder.newColumnDef(7).withOption('width', '15%')
    ];
    $scope.dtColumnDefs2 = [
        DTColumnDefBuilder.newColumnDef(5).withOption('width', '15%'),
        DTColumnDefBuilder.newColumnDef(6).withOption('width', '15%')
    ];
    $scope.dtColumnDefs3 = [
        DTColumnDefBuilder.newColumnDef(5).withOption('width', '15%')
    ];

    $scope.offers = [
        {id:'4', username:'user4', initLoc:'HKUST', destination:'Choi Hung', availableSeats: '3', genderPref:'-', timestamp:'2015/10/25 06:48'},
        {id:'2', username:'user2', initLoc:'HKUST', destination:'Hang Hau', availableSeats: '2', genderPref:'F', timestamp:'2015/10/26 13:24'},
    ];

    $scope.requests = [
        {id:'7', username:'user7', initLoc:'Hang Hau', destination:'HKUST', genderPref:'-', timestamp:'2015/10/25 07:08'},
        {id:'12', username:'user12', initLoc:'HKUST', destination:'Choi Hung', genderPref:'F', timestamp:'2015/10/27 12:54'},
        {id:'5', username:'user5', initLoc:'Sai Kung', destination:'HKUST', genderPref:'M', timestamp:'2015/10/29 09:23'},
    ];

    $scope.joins = [
        {driverId:'7', memberId:'1', timestamp:'2015/10/25 07:08', match_icon:'icon_001.png', finished:'Y'},
        {driverId:'3', memberId:'2', timestamp:'2015/10/27 12:54', match_icon:'icon_002.png', finished:'Y'},
    ];

}).controller('vehicleCtrl', function($scope, DTOptionsBuilder, DTColumnDefBuilder){

    $scope.dtOptions = DTOptionsBuilder.newOptions().withPaginationType('simple').withOption('responsive', true);
    $scope.dtColumnDefs1 = [
        DTColumnDefBuilder.newColumnDef(3).withOption('width', '18%')
    ];
    $scope.dtColumnDefs2 = [
        DTColumnDefBuilder.newColumnDef(2).withOption('width', '18%')
    ];

    $scope.registers = [
        {license_number:'GG404', color:'blue', maker:'Benz'},
        {license_number:'GG504', color:'red', maker:'Benz'},
        {license_number:'GG604', color:'grey', maker:'Benz'},
        {license_number:'GG704', color:'black', maker:'Benz'},
    ];

    $scope.owns = [
        {id:'0', memberId:'7', license_number:'GG404'},
        {id:'1', memberId:'12', license_number:'GG504'},
        {id:'2', memberId:'5', license_number:'GG604'},
        {id:'3', memberId:'5', license_number:'GG704'},
    ];
    
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
        $scope.editingRegData[register.license_number] = false;
    };
    
    $scope.modifyOwn = function(own){
        $scope.editingOwnData[own.id] = true;
    };

    $scope.updateOwn = function(own){
        $scope.editingOwnData[own.id] = false;
    };

}).controller('uploadCtrl', function($scope){

});


