angular.module('mainApp', ['ui.router', 'ngStorage', 'datatables', 'ui.bootstrap'])
.config(function($stateProvider, $urlRouterProvider){
    $urlRouterProvider.otherwise('/login');
    $stateProvider
    .state('login', {
        url: '/login',
        params: {msg: {}},
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
        })

})
.run(function($rootScope, $state, $localStorage) {
    $rootScope.$on('$stateChangeSuccess', function (evt, toState) {
        if (toState.name === 'home') {
            $state.go('.dashboard');
        }
    });
    $localStorage.$default({
        accessToken: null
    });

})

// Controllers

.controller('loginCtrl', function($scope, $state, $localStorage, $stateParams){

    $localStorage.accessToken = null;
    $scope.alertInfo = $stateParams;

    $scope.login = function(data){
        if (data && data.username && data.password){
            if (true){
                $localStorage.accessToken = 12345;
                $state.go('home');
            } else{
                $state.go('login', {msg: 'Incorrect Username or Password!'});
            }
        }
    };

})
.controller('homeCtrl', function($scope, $state, $localStorage){

    $scope.loginCheck = function(){
        if (!$localStorage.accessToken){
            $state.go('login', {msg: 'You are required to login before accessing the page!'});
        }
    };

    $scope.logout = function(){
        $localStorage.accessToken = null;
        $state.go('login');
    };

})
.controller('dashboardCtrl', function($scope){

    // Timeline
    $scope.events = [
        {type:'Offer', username:'user4', time:'11 mins ago', from:'HKUST', to:'Choi Hung'},
        {type:'Request', username:'user7', time:'23 mins ago', from:'Hang Hau', to:'HKUST'},
        {type:'Request', username:'user12', time:'47 mins ago', from:'HKUST', to:'Choi Hung'},
        {type:'Offer', username:'user2', time:'1 hour ago', from:'HKUST', to:'Hang Hau'},
        {type:'Request', username:'user5', time:'1 hour ago', from:'Sai Kung', to:'HKUST'},
    ];

    // Bar Chart
    $scope.offerRequestData = [
        {Date: "18/10", Offer: 34, Request: 66},
        {Date: "19/10", Offer: 23, Request: 49},
        {Date: "20/10", Offer: 38, Request: 53},
        {Date: "21/10", Offer: 42, Request: 48},
        {Date: "22/10", Offer: 38, Request: 52},
        {Date: "23/10", Offer: 27, Request: 36},
        {Date: "24/10", Offer: 34, Request: 51},
    ];

    Morris.Bar({
        element: 'offerRequestChart',
        data: $scope.offerRequestData,
        xkey: 'Date',
        ykeys: ['Offer', 'Request'],
        labels: ['Offer', 'Request'],
        hideHover: 'auto',
        smooth: false,
        resize: true
    });

    // Donut Chart
    $scope.usersData = [
        {value: 125, label: "Drivers"},
        {value: 256, label: "Passengers"},
    ];

    Morris.Donut({
        element: 'usersChart',
        data: $scope.usersData,
        colors: ['#0ba462', '#337ab7'],
        resize: true
    }).select(0);

    $scope.users2Data = [
        {value: 220, label: "Male"},
        {value: 161, label: "Female"},
    ];

    Morris.Donut({
        element: 'users2Chart',
        data: $scope.users2Data,
        colors: ['#337ab7', '#d9534f'],
        resize: true
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

}).controller('uploadCtrl', function($scope, DTOptionsBuilder, DTColumnDefBuilder){

});


