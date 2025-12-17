// Simple localStorage based auth and data for demo
(function(){
    const LS_USERS = 'inovation_users';
    const LS_ORDERS = 'inovation_orders';
    const LS_SESSION = 'inovation_session';
    const LS_COMPANIES = 'inovation_companies';
    const LS_CHATS = 'inovation_chats';

    function uid(prefix='id'){
        return prefix + '_' + Math.random().toString(36).substr(2,9);
    }

    function readUsers(){ 
        return JSON.parse(localStorage.getItem(LS_USERS) || '[]'); 
    }
    
    function writeUsers(u){ 
        localStorage.setItem(LS_USERS, JSON.stringify(u)); 
    }

    function readCompanies(){ 
        return JSON.parse(localStorage.getItem(LS_COMPANIES) || '[]'); 
    }
    
    function writeCompanies(c){ 
        localStorage.setItem(LS_COMPANIES, JSON.stringify(c)); 
    }

    function readOrders(){ 
        return JSON.parse(localStorage.getItem(LS_ORDERS) || '[]'); 
    }
    
    function writeOrders(o){ 
        localStorage.setItem(LS_ORDERS, JSON.stringify(o)); 
    }

    function readChats(){ 
        return JSON.parse(localStorage.getItem(LS_CHATS) || '{}'); 
    }
    
    function writeChats(c){ 
        localStorage.setItem(LS_CHATS, JSON.stringify(c)); 
    }

    // Initialize demo data if none exists
    if(!readUsers().length){
        const demoUsers = [
            { 
                id: uid('usr'), 
                name: 'عميل تجريبي', 
                phone: '+201000000001', 
                password: '123456', 
                role: 'customer',
                nationality: 'مصري',
                gender: 'male',
                isDemo: true,
                createdAt: new Date().toISOString()
            },
            { 
                id: uid('usr'), 
                name: 'مندوب تجريبي', 
                phone: '+201000000002', 
                password: '123456', 
                role: 'driver', 
                vehicleType: 'فان',
                nationality: 'مصري',
                gender: 'male',
                isDemo: true,
                createdAt: new Date().toISOString()
            }
        ];
        writeUsers(demoUsers);
    }

    // Main Application Object
    const InovationApp = {
        // Auth Functions
        register({name, phone, password, role, vehicleType, nationality, gender}){
            if(!name || !phone || !password || !nationality) {
                return {success: false, message: 'يرجى ملء جميع الحقول الأساسية'};
            }
            
            // Validate phone format
            if(!phone.match(/^\+\d{10,15}$/)) {
                return {success: false, message: 'رقم الهاتف غير صحيح. يجب أن يبدأ بـ + ويتبعه 10-15 رقم'};
            }
            
            // Validate password strength
            if(password.length < 6) {
                return {success: false, message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'};
            }
            
            const users = readUsers();
            if(users.find(u => u.phone === phone && !u.isDemo)) {
                return {success: false, message: 'هذا الهاتف مسجل بالفعل'};
            }
            
            const user = { 
                id: uid('usr'), 
                name, 
                phone, 
                password, 
                role, 
                vehicleType: role === 'driver' ? vehicleType : null,
                nationality,
                gender,
                isDemo: false,
                isActive: true,
                createdAt: new Date().toISOString(),
                lastLogin: null
            };
            
            users.push(user); 
            writeUsers(users);
            return {success: true, user};
        },
        
        registerCompany(companyData){
            const required = ['companyName', 'commercialId', 'companyPhone', 'password', 'managerName'];
            for(let field of required) {
                if(!companyData[field]) {
                    return {success: false, message: 'يرجى ملء جميع الحقول الأساسية'};
                }
            }
            
            // Validate phone format
            if(!companyData.companyPhone.match(/^\+\d{10,15}$/)) {
                return {success: false, message: 'رقم هاتف الشركة غير صحيح. يجب أن يبدأ بـ + ويتبعه 10-15 رقم'};
            }
            
            // Validate password strength
            if(companyData.password.length < 6) {
                return {success: false, message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'};
            }
            
            const companies = readCompanies();
            const users = readUsers();
            
            if(companies.find(c => c.commercialId === companyData.commercialId)) {
                return {success: false, message: 'هذا السجل التجاري مسجل بالفعل'};
            }
            
            if(users.find(u => u.phone === companyData.companyPhone && !u.isDemo)) {
                return {success: false, message: 'هاتف الشركة مسجل بالفعل'};
            }
            
            const companyId = uid('comp');
            const companyUser = {
                id: uid('usr'),
                name: companyData.companyName,
                phone: companyData.companyPhone,
                password: companyData.password,
                role: 'company',
                companyId: companyId,
                isDemo: false,
                isActive: true,
                createdAt: new Date().toISOString(),
                lastLogin: null
            };
            
            const company = {
                id: companyId,
                ...companyData,
                isActive: true,
                createdAt: new Date().toISOString()
            };
            
            companies.push(company);
            users.push(companyUser);
            
            writeCompanies(companies);
            writeUsers(users);
            
            return {success: true, company: companyUser};
        },
        
        login(phone, password, role){
            const users = readUsers();
            const user = users.find(u => u.phone === phone && u.password === password && u.role === role && u.isActive);
            
            if(!user) {
                return {success: false, message: 'بيانات الدخول غير صحيحة أو الدور خاطئ'};
            }
            
            // Update last login
            user.lastLogin = new Date().toISOString();
            writeUsers(users);
            
            const session = { 
                id: user.id, 
                role: user.role, 
                companyId: user.companyId,
                loginTime: new Date().toISOString(),
                isDemo: user.isDemo || false
            };
            
            localStorage.setItem(LS_SESSION, JSON.stringify(session));
            return {success: true, user};
        },
        
        logout(){
            localStorage.removeItem(LS_SESSION);
            return {success: true};
        },
        
        current(){
            const session = JSON.parse(localStorage.getItem(LS_SESSION) || 'null');
            if(!session) return null;
            
            const users = readUsers();
            const user = users.find(u => u.id === session.id && u.isActive);
            return user ? { ...user, session } : null;
        },
        
        isLoggedIn(){
            return this.current() !== null;
        },
        
        // User Management Functions
        updateProfile(userId, updates){
            const users = readUsers();
            const userIndex = users.findIndex(u => u.id === userId);
            
            if(userIndex !== -1) {
                users[userIndex] = { ...users[userIndex], ...updates, updatedAt: new Date().toISOString() };
                writeUsers(users);
                return {success: true, user: users[userIndex]};
            }
            return {success: false, message: 'المستخدم غير موجود'};
        },
        
        changePassword(userId, currentPassword, newPassword){
            const users = readUsers();
            const user = users.find(u => u.id === userId);
            
            if(!user) {
                return {success: false, message: 'المستخدم غير موجود'};
            }
            
            if(user.password !== currentPassword) {
                return {success: false, message: 'كلمة المرور الحالية غير صحيحة'};
            }
            
            if(newPassword.length < 6) {
                return {success: false, message: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل'};
            }
            
            user.password = newPassword;
            user.updatedAt = new Date().toISOString();
            writeUsers(users);
            
            return {success: true, message: 'تم تغيير كلمة المرور بنجاح'};
        },
        
        // Stats Functions
        getUserStats(){
            const users = readUsers();
            const orders = readOrders();
            const realUsers = users.filter(u => !u.isDemo);
            
            return {
                totalUsers: realUsers.length,
                customers: realUsers.filter(u => u.role === 'customer').length,
                drivers: realUsers.filter(u => u.role === 'driver').length,
                companies: realUsers.filter(u => u.role === 'company').length,
                totalOrders: orders.length,
                pendingOrders: orders.filter(o => o.status === 'pending').length,
                completedOrders: orders.filter(o => o.status === 'delivered').length
            };
        },

        // Data Functions
        createOrder(orderData, customerId){
            const orders = readOrders();
            const users = readUsers();
            const customer = users.find(u => u.id === customerId);
            
            const order = {
                _id: uid('ord'),
                customerId,
                customerName: customer?.name || 'غير معروف',
                pickup: orderData.pickup,
                delivery: orderData.delivery,
                shipmentType: orderData.shipmentType,
                preferredPickup: orderData.preferredPickup,
                notes: orderData.notes,
                status: 'pending',
                assignedDriver: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            orders.push(order);
            writeOrders(orders);
            return order;
        },
        
        getOrdersByCustomer(customerId){
            const orders = readOrders();
            return orders
                .filter(o => o.customerId === customerId)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        },
        
        getPendingOrders(){
            const orders = readOrders();
            return orders.filter(o => o.status === 'pending');
        },
        
        getOrdersByDriver(driverId){
            const orders = readOrders();
            return orders.filter(o => o.assignedDriver && o.assignedDriver.id === driverId);
        },
        
        assignDriver(orderId, driverId){
            const orders = readOrders();
            const users = readUsers();
            
            const order = orders.find(o => o._id === orderId);
            const driver = users.find(u => u.id === driverId);
            
            if(order && driver) {
                order.assignedDriver = { 
                    id: driver.id, 
                    name: driver.name,
                    phone: driver.phone 
                };
                order.status = 'accepted';
                order.updatedAt = new Date().toISOString();
                writeOrders(orders);
                return true;
            }
            return false;
        },
        
        updateOrderStatus(orderId, status){
            const orders = readOrders();
            const order = orders.find(o => o._id === orderId);
            
            if(order) {
                order.status = status;
                order.updatedAt = new Date().toISOString();
                writeOrders(orders);
                return true;
            }
            return false;
        },
        
        // Chat Functions
        getChat(orderId){
            const chats = readChats();
            return chats[orderId] || [];
        },
        
        addMessage(orderId, senderId, text){
            const chats = readChats();
            if(!chats[orderId]) chats[orderId] = [];
            
            const message = {
                id: uid('msg'),
                senderId,
                text,
                timestamp: new Date().toISOString()
            };
            
            chats[orderId].push(message);
            writeChats(chats);
            return message;
        },
        
        // Utility Functions
        formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        },
        
        getStatusText(status) {
            const statusMap = {
                'pending': 'قيد الانتظار',
                'accepted': 'قيد التنفيذ',
                'delivered': 'تم التسليم',
                'cancelled': 'ملغي'
            };
            return statusMap[status] || status;
        },
        
        getStatusColor(status) {
            const colorMap = {
                'pending': 'status-pending',
                'accepted': 'status-accepted',
                'delivered': 'status-delivered',
                'cancelled': 'status-cancelled'
            };
            return colorMap[status] || 'status-pending';
        },
        
        // Validation Functions
        validatePhone(phone) {
            return phone.match(/^\+\d{10,15}$/);
        },
        
        validateEmail(email) {
            return email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
        },
        
        // Demo account detection
        isDemoAccount(user) {
            return user && user.isDemo === true;
        }
    };

    // UI Helper Functions
    const UIHelper = {
        showLoading(button) {
            const original = button.innerHTML;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري المعالجة...';
            button.disabled = true;
            return original;
        },
        
        hideLoading(button, original) {
            button.innerHTML = original;
            button.disabled = false;
        },
        
        showMessage(message, type = 'error') {
            // Create message element
            const messageEl = document.createElement('div');
            messageEl.className = `message ${type}`;
            messageEl.innerHTML = `
                <div style="padding: 12px; margin: 10px 0; border-radius: 8px; 
                           background: ${type === 'error' ? '#fee2e2' : '#d1fae5'}; 
                           color: ${type === 'error' ? '#b91c1c' : '#065f46'}; 
                           border: 1px solid ${type === 'error' ? '#fecaca' : '#a7f3d0'};">
                    ${message}
                </div>
            `;
            
            // Add to page
            const existingMsg = document.querySelector('.message');
            if(existingMsg) {
                existingMsg.remove();
            }
            
            document.querySelector('.auth-body')?.prepend(messageEl) || 
            document.querySelector('.card-body')?.prepend(messageEl) ||
            document.body.prepend(messageEl);
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                messageEl.remove();
            }, 5000);
        },
        
        redirect(url, delay = 1000) {
            setTimeout(() => {
                window.location.href = url;
            }, delay);
        },
        
        formatPhoneInput(input) {
            // Auto-format phone number with country code
            let value = input.value.replace(/\D/g, '');
            if(value && !value.startsWith('20')) {
                value = '20' + value;
            }
            if(value) {
                input.value = '+' + value;
            }
        }
    };

    // Mobile Menu Toggle
    document.addEventListener('DOMContentLoaded', function() {
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        const mobileMenu = document.querySelector('.mobile-menu');
        
        if(mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', function() {
                mobileMenu.classList.toggle('active');
            });
        }
        
        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                
                const targetId = this.getAttribute('href');
                if(targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                if(targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                    
                    // Close mobile menu if open
                    document.querySelector('.mobile-menu')?.classList.remove('active');
                }
            });
        });
        
        // Add animation on scroll
        window.addEventListener('scroll', function() {
            const elements = document.querySelectorAll('.feature-card, .step, .testimonial-card');
            
            elements.forEach(element => {
                const position = element.getBoundingClientRect();
                
                if(position.top < window.innerHeight - 100) {
                    element.style.opacity = '1';
                    element.style.transform = 'translateY(0)';
                }
            });
        });
        
        // Initialize elements for animation
        document.querySelectorAll('.feature-card, .step, .testimonial-card').forEach(element => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        });
        
        // Trigger initial animation
        window.dispatchEvent(new Event('scroll'));
        
        // Auto-format phone inputs
        document.querySelectorAll('input[type="tel"]').forEach(input => {
            input.addEventListener('input', function() {
                UIHelper.formatPhoneInput(this);
            });
        });
    });

    // Expose to global scope
    window.InovationApp = InovationApp;
    window.UIHelper = UIHelper;
})();