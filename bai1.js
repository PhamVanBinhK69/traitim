let startTime, timerInterval, lapCount = 0;
let elapsedTime = 0;
let animationId = null;
let hue = 0;
let time = 0;

const display = document.getElementById("display");
const startBtn = document.getElementById("startBtn");
const lapBtn = document.getElementById("lapBtn");
const stopBtn = document.getElementById("stopBtn");
const resetBtn = document.getElementById("resetBtn");
const lapsList = document.getElementById("lapsList");
const heartBtn = document.getElementById("heartBtn");
const backBtn = document.getElementById("backBtn");
const stopwatchContainer = document.getElementById("stopwatch-container");
const heartContainer = document.getElementById("heart-container");

// --- 1. CÁC HÀM ĐỒNG HỒ ---
function timeToString(time) {
    let diffInMin = time / 60000;
    let mm = Math.floor(diffInMin);
    let diffInSec = (diffInMin - mm) * 60;
    let ss = Math.floor(diffInSec);
    let diffInMs = (diffInSec - ss) * 100;
    let ms = Math.floor(diffInMs);
    return `${mm.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
}


lapBtn.addEventListener("click", () => {
    lapCount++;
    const li = document.createElement("li");
    li.innerHTML = `<span style="color: #7f8c8d;">Vòng ${lapCount}</span> <span>${timeToString(elapsedTime)}</span>`;
    lapsList.prepend(li);
});

// --- 2. LOGIC TRÁI TIM NGUYÊN BẢN ---
function runHeartEffect() {
    if (animationId) cancelAnimationFrame(animationId);
    const canvas = document.getElementById('pinkboard');
    if (!canvas) return;
    const context = canvas.getContext('2d');

    // Cấu hình: Giảm size hạt, tăng số lượng để tạo hiệu ứng "bụi sao" mịn màng
    const settings = { particles: { length: 2000, duration: 5, velocity: 80, effect: -0.8, size: 2 } };

    // --- ĐỊNH NGHĨA CÁC CLASS CẦN THIẾT ---
    var Point = function(x, y) {
        this.x = x || 0;
        this.y = y || 0;
    };
    Point.prototype.clone = function() { return new Point(this.x, this.y); };
    Point.prototype.length = function(l) {
        if (typeof l == 'undefined') return Math.sqrt(this.x * this.x + this.y * this.y);
        this.normalize();
        this.x *= l;
        this.y *= l;
        return this;
    };
    Point.prototype.normalize = function() {
        var l = this.length();
        this.x /= l;
        this.y /= l;
        return this;
    };

    var Particle = function() {
        this.position = new Point();
        this.velocity = new Point();
        this.acceleration = new Point();
        this.age = 0;
    };
    Particle.prototype.initialize = function(x, y, dx, dy) {
        this.position.x = x;
        this.position.y = y;
        this.velocity.x = dx;
        this.velocity.y = dy;
        this.acceleration.x = dx * settings.particles.effect;
        this.acceleration.y = dy * settings.particles.effect;
        this.age = 0;
    };
    Particle.prototype.update = function(dt) {
        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;
        this.velocity.x += this.acceleration.x * dt;
        this.velocity.y += this.acceleration.y * dt;
        this.age += dt;
    };

    var particles = new Array(settings.particles.length);
    for (var i = 0; i < settings.particles.length; i++) particles[i] = new Particle();
    var firstFree = 0;

    function pointOnHeart(t) {
        // Nhịp đập: sin(time) dao động từ -1 đến 1, 
        // ta cộng 1 để nó dao động từ 0 đến 2, chia cho 10 để nhịp đập nhẹ nhàng
        let pulse = 1 + Math.sin(time) * 0.3;

        let x = 160 * Math.pow(Math.sin(t), 3);
        let y = 130 * Math.cos(t) - 50 * Math.cos(2 * t) - 20 * Math.cos(3 * t) - 10 * Math.cos(4 * t) + 25;

        // Nhân với pulse để trái tim co bóp
        return new Point(x * pulse, y * pulse);
    }

    function render() {
        animationId = requestAnimationFrame(render);
        time += 0.1;
        // Tạo vệt sáng huyền ảo bằng cách không xóa hoàn toàn màn hình
        context.fillStyle = "rgba(0, 0, 0, 0.08)";
        context.fillRect(0, 0, canvas.width, canvas.height);

        var dt = 0.05;
        var amt = (settings.particles.length / settings.particles.duration) * dt;

        for (var i = 0; i < amt; i++) {
            var pos = pointOnHeart(Math.PI - 2 * Math.PI * Math.random());
            var dir = pos.clone().length(settings.particles.velocity);
            particles[firstFree].initialize(canvas.width / 2 + pos.x, canvas.height / 2 - pos.y, dir.x, -dir.y);
            firstFree++;
            if (firstFree == particles.length) firstFree = 0;
        }

        hue += 0.5;
        for (var i = 0; i < particles.length; i++) {
            particles[i].update(dt);
            if (particles[i].age < settings.particles.duration) {
                // Áp dụng hiệu ứng tỏa sáng (Glow)
                context.save();
                context.shadowBlur = 10;
                context.shadowColor = `hsl(${(hue + particles[i].age * 20) % 360}, 100%, 70%)`;
                context.fillStyle = `hsl(${(hue + particles[i].age * 20) % 360}, 100%, 50%)`;
                context.globalAlpha = 1 - (particles[i].age / settings.particles.duration);

                context.beginPath();
                context.arc(particles[i].position.x, particles[i].position.y, settings.particles.size, 0, Math.PI * 2);
                context.fill();
                context.restore();
            }
        }
    }
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    render();
}

startBtn.addEventListener("click", () => {
    startTime = Date.now() - elapsedTime;
    timerInterval = setInterval(() => {
        elapsedTime = Date.now() - startTime;
        display.innerHTML = timeToString(elapsedTime);
    }, 10);

    // Chuyển trạng thái giao diện khi chạy
    startBtn.classList.add("hidden");
    heartBtn.classList.add("hidden"); // Ẩn nút trái tim
    stopBtn.classList.remove("hidden");
    lapBtn.classList.remove("hidden");
    resetBtn.classList.add("hidden"); // Chưa cho phép reset khi đang chạy
});

stopBtn.addEventListener("click", () => {
    clearInterval(timerInterval);

    // Khi dừng: Hiện Bắt đầu (tiếp tục), Đặt lại
    stopBtn.classList.add("hidden");
    lapBtn.classList.add("hidden");
    startBtn.classList.remove("hidden");
    startBtn.innerHTML = "Tiếp tục"; // Đổi nhãn nút nếu muốn
    resetBtn.classList.remove("hidden");
});

resetBtn.addEventListener("click", () => {
    clearInterval(timerInterval);
    display.innerHTML = "00:00:00.00";
    elapsedTime = 0;
    lapCount = 0;
    lapsList.innerHTML = "";

    // Trở về trạng thái ban đầu
    resetBtn.classList.add("hidden");
    startBtn.classList.remove("hidden");
    startBtn.innerHTML = "Bắt đầu"; // Reset nhãn nút
    heartBtn.classList.remove("hidden");
});
// --- 3. ĐIỀU HƯỚNG ---
heartBtn.addEventListener("click", () => {
    // Ẩn đồng hồ, hiện trái tim
    stopwatchContainer.classList.add("hidden");
    heartContainer.classList.remove("hidden");

    // Khởi tạo Canvas
    const canvas = document.getElementById('pinkboard');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    runHeartEffect();
});
// Cập nhật lại sự kiện của nút "Quay lại"
backBtn.addEventListener("click", () => {
    // 1. Dừng animation
    cancelAnimationFrame(animationId);

    // 2. Ẩn trái tim, hiện lại đồng hồ
    heartContainer.classList.add("hidden");
    stopwatchContainer.classList.remove("hidden");

    // 3. Xóa canvas
    const canvas = document.getElementById('pinkboard');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});