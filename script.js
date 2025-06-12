// Define the special dates
const specialDates = {
    'first-message': {
        date: new Date('2023-04-10T00:00:00')
    },
    'first-kiss': {
        date: new Date('2023-05-27T00:00:00')
    },
    'commitment': {
        date: new Date('2023-11-02T00:00:00')
    }
};

// Initialize the scroll functionality
document.addEventListener('DOMContentLoaded', () => {
    const layers = document.querySelectorAll('.layer');
    const scrollIndicators = document.querySelectorAll('.scroll-indicator');
    const backToTopButton = document.getElementById('back-to-top');

    // Show initial scroll indicator after a short delay
    setTimeout(() => {
        if (scrollIndicators[0]) {
            scrollIndicators[0].classList.add('visible');
        }
    }, 1000);

    // Handle scroll events to show/hide indicators
    let lastScrollTop = 0;
    let isScrolling = false;

    function handleScroll() {
        if (isScrolling) return;
        
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;

        // Show appropriate scroll indicator based on scroll position
        layers.forEach((layer, index) => {
            const layerRect = layer.getBoundingClientRect();
            const isVisible = layerRect.top < windowHeight && layerRect.bottom > 0;
            
            // Find the corresponding indicator
            const indicator = layer.querySelector('.scroll-indicator');
            if (indicator) {
                // Show indicator if this is not the last layer and the layer is visible
                const isLastLayer = index === layers.length - 1;
                indicator.classList.toggle('visible', isVisible && !isLastLayer);
            }

            // Handle back-to-top button visibility
            if (backToTopButton && index === layers.length - 1) {
                // Show back-to-top button only when the last layer is fully visible
                const isLastLayerFullyVisible = layerRect.top <= 0 && layerRect.bottom >= windowHeight;
                backToTopButton.classList.toggle('visible', isLastLayerFullyVisible);
            }
        });

        lastScrollTop = scrollTop;
    }

    // Throttle scroll events
    window.addEventListener('scroll', () => {
        if (!isScrolling) {
            isScrolling = true;
            requestAnimationFrame(() => {
                handleScroll();
                isScrolling = false;
            });
        }
    }, { passive: true });

    // Back to top button click handler
    if (backToTopButton) {
        backToTopButton.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Function to format time units with leading zeros
    function padNumber(number) {
        return number.toString().padStart(2, '0');
    }

    // Function to calculate time difference
    function calculateTimeDifference(startDate) {
        const now = new Date();
        const diff = now - startDate;

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        return {
            days: days,
            hours: padNumber(hours),
            minutes: padNumber(minutes),
            seconds: padNumber(seconds)
        };
    }

    // Function to update all counters
    function updateCounters() {
        // Update the hours since first message
        const firstMessageDate = specialDates['first-message'].date;
        const now = new Date();
        const diffInHours = Math.floor((now - firstMessageDate) / (1000 * 60 * 60));
        const hoursElement = document.getElementById('hours-since-first-message');
        if (hoursElement) {
            hoursElement.textContent = diffInHours.toLocaleString();
        }

        // Update other counters
        for (const [id, data] of Object.entries(specialDates)) {
            const counter = document.getElementById(`${id}-counter`);
            if (counter) {
                const time = calculateTimeDifference(data.date);
                counter.querySelector('.time').innerHTML = 
                    `${time.days} dias<br>` +
                    `${time.hours} horas<br>` +
                    `${time.minutes} minutos<br>` +
                    `${time.seconds} segundos`;
            }
        }
    }

    // Update counters immediately and then every second
    updateCounters();
    setInterval(updateCounters, 1000);

    // Initialize scroll state
    let currentLayerIndex = 0;
    let scrollTimeout = null;
    let lastScrollTime = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let lastTouchY = 0;
    let touchVelocity = 0;
    let touchMoveCount = 0;

    // Dynamic thresholds based on screen size
    const getScrollThresholds = () => {
        const screenHeight = window.innerHeight;
        return {
            minDistance: Math.max(20, screenHeight * 0.05), // 5% of screen height, minimum 20px
            maxTime: 800, // Maximum time for a scroll gesture
            velocityThreshold: 0.3 // Minimum velocity to trigger a scroll
        };
    };

    function scrollToLayer(index) {
        if (index < 0 || index >= layers.length || isScrolling) return;
        
        isScrolling = true;
        currentLayerIndex = index;
        
        // Disable scroll events temporarily
        document.body.style.overflow = 'hidden';
        
        layers[index].scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });

        // Re-enable scroll events after animation
        setTimeout(() => {
            isScrolling = false;
            document.body.style.overflow = '';
            lastScrollTime = Date.now();
            // Reset touch tracking
            touchVelocity = 0;
            touchMoveCount = 0;
        }, 1000);
    }

    // Touch event handlers
    window.addEventListener('touchstart', (e) => {
        if (isScrolling) return;
        touchStartY = e.touches[0].clientY;
        lastTouchY = touchStartY;
        touchStartTime = Date.now();
        touchMoveCount = 0;
        touchVelocity = 0;
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (isScrolling) return;
        
        const touchY = e.touches[0].clientY;
        const currentTime = Date.now();
        const timeDiff = currentTime - touchStartTime;
        
        // Calculate velocity (pixels per millisecond)
        const distance = lastTouchY - touchY;
        const timeStep = currentTime - lastScrollTime;
        if (timeStep > 0) {
            touchVelocity = (touchVelocity * touchMoveCount + (distance / timeStep)) / (touchMoveCount + 1);
        }
        
        touchMoveCount++;
        lastTouchY = touchY;
        
        // If we've moved enough or have enough velocity, prevent default
        const thresholds = getScrollThresholds();
        if (Math.abs(touchY - touchStartY) > thresholds.minDistance || 
            Math.abs(touchVelocity) > thresholds.velocityThreshold) {
            e.preventDefault();
        }
    }, { passive: false });

    window.addEventListener('touchend', (e) => {
        if (isScrolling) return;
        
        const touchEndY = e.changedTouches[0].clientY;
        const touchEndTime = Date.now();
        const totalDiff = touchStartY - touchEndY;
        const timeDiff = touchEndTime - touchStartTime;
        const thresholds = getScrollThresholds();
        
        // Determine if we should change layers based on:
        // 1. Total distance moved
        // 2. Velocity of the movement
        // 3. Time taken for the gesture
        const shouldChangeLayer = 
            (Math.abs(totalDiff) > thresholds.minDistance && timeDiff < thresholds.maxTime) || // Distance-based
            (Math.abs(touchVelocity) > thresholds.velocityThreshold && touchMoveCount > 2); // Velocity-based
        
        if (shouldChangeLayer) {
            const direction = totalDiff > 0 ? 1 : -1;
            const nextIndex = currentLayerIndex + direction;
            scrollToLayer(nextIndex);
        } else if (Math.abs(totalDiff) > 5) { // Even tiny movements should trigger a snap
            scrollToLayer(currentLayerIndex);
        }
    }, { passive: true });

    // Wheel event handler with similar dynamic thresholds
    window.addEventListener('wheel', (e) => {
        if (isScrolling) return;
        e.preventDefault();
        
        const thresholds = getScrollThresholds();
        const deltaY = e.deltaY;
        const timeDiff = Date.now() - lastScrollTime;
        
        // Calculate wheel velocity
        const wheelVelocity = Math.abs(deltaY) / timeDiff;
        
        // Determine if we should change layers based on:
        // 1. Wheel delta magnitude
        // 2. Wheel velocity
        const shouldChangeLayer = 
            Math.abs(deltaY) > thresholds.minDistance || 
            wheelVelocity > thresholds.velocityThreshold;
        
        if (shouldChangeLayer) {
            const direction = deltaY > 0 ? 1 : -1;
            const nextIndex = currentLayerIndex + direction;
            scrollToLayer(nextIndex);
        } else if (Math.abs(deltaY) > 5) { // Small wheel movements should snap
            scrollToLayer(currentLayerIndex);
        }
    }, { passive: false });

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
        if (isScrolling) return;
        
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            const direction = e.key === 'ArrowDown' ? 1 : -1;
            const nextIndex = currentLayerIndex + direction;
            
            scrollToLayer(nextIndex);
        }
    });

    // Scroll event handler to enforce snapping
    window.addEventListener('scroll', (e) => {
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
        
        scrollTimeout = setTimeout(() => {
            handleScroll(e);
        }, 50);
    }, { passive: false });

    // Initial setup
    function initializeScroll() {
        // Find the initial visible layer
        const windowHeight = window.innerHeight;
        layers.forEach((layer, index) => {
            const rect = layer.getBoundingClientRect();
            if (rect.top <= windowHeight / 2 && rect.bottom >= windowHeight / 2) {
                currentLayerIndex = index;
                // Ensure we're properly snapped to this layer
                scrollToLayer(index);
            }
        });
    }

    // Initialize on load and resize
    window.addEventListener('load', initializeScroll);
    window.addEventListener('resize', () => {
        // Snap to current layer on resize
        scrollToLayer(currentLayerIndex);
    });

    // Update scroll indicators and back to top button visibility
    function updateUI() {
        scrollIndicators.forEach((indicator, index) => {
            // Show scroll indicator on all layers except the last one
            indicator.style.display = index < layers.length - 1 ? 'flex' : 'none';
        });

        // Show back to top button only on the last layer
        if (backToTopButton) {
            backToTopButton.style.display = currentLayerIndex === layers.length - 1 ? 'block' : 'none';
        }
    }
}); 