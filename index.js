// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAgq9nILlMXcmfjJGXyu9VgxRc0rBB8M2A",
    authDomain: "art-gallery-website-4b646.firebaseapp.com",
    databaseURL: "https://art-gallery-website-4b646-default-rtdb.firebaseio.com",
    projectId: "art-gallery-website-4b646",
    storageBucket: "art-gallery-website-4b646.firebasestorage.app",
    messagingSenderId: "467391852619",
    appId: "1:467391852619:web:9e4d6612bf2402c9adddce"
};

// Initialize Firebase
let database;
let firebaseInitialized = false;

try {
    firebase.initializeApp(firebaseConfig);
    database = firebase.database();
    firebaseInitialized = true;
} catch (error) {
    console.error("Firebase initialization error:", error);
    firebaseInitialized = false;
}

document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('meteor-container');
    const meteorCount = 20;
    
    // Global variable to store current configuration
    let currentConfig = null;
    let visitorTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    let currentArtData = null; // Store current art data for download

    // Art Modal functionality
    // Art Modal functionality with screenshot protection
function initializeArtModal() {
    const modal = document.getElementById('art-modal');
    const closeBtn = document.querySelector('.art-modal-close');
    const closeBtnFooter = document.querySelector('.close-btn');
    const downloadBtn = document.getElementById('download-art');
    const artBoxes = document.querySelectorAll('.art-box');

    // Enhanced protection functions
    function enableImageProtection() {
        // Add protection overlay
        const overlay = document.createElement('div');
        overlay.className = 'image-protection-overlay';
        document.querySelector('.art-modal-body').appendChild(overlay);
        
        // Add CSS class to body when modal is open
        document.body.classList.add('art-modal-open');
        
        // Disable text selection in modal
        modal.style.userSelect = 'none';
        modal.style.webkitUserSelect = 'none';
        modal.style.mozUserSelect = 'none';
        modal.style.msUserSelect = 'none';
    }

    function disableImageProtection() {
        // Remove protection overlay
        const overlay = document.querySelector('.image-protection-overlay');
        if (overlay) {
            overlay.remove();
        }
        
        // Remove CSS class from body
        document.body.classList.remove('art-modal-open');
        
        // Re-enable text selection
        modal.style.userSelect = '';
        modal.style.webkitUserSelect = '';
        modal.style.mozUserSelect = '';
        modal.style.msUserSelect = '';
    }

    // Open modal when art box is clicked
    artBoxes.forEach(box => {
        box.addEventListener('click', function() {
            const artTitle = this.getAttribute('data-art');
            const artDate = this.getAttribute('data-date');
            const artImage = this.getAttribute('data-image');
            
            document.getElementById('modal-art-title').textContent = artTitle;
            document.getElementById('modal-art-date').textContent = artDate;
            document.getElementById('modal-art-image').src = artImage;
            document.getElementById('modal-art-image').alt = artTitle;
            
            // Set current art data
            currentArtData = {
                title: artTitle,
                image: artImage,
                date: artDate
            };
            
            // Load download statistics and update quality display
            loadDownloadStats(artTitle);
            
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Enable protection when modal opens
            enableImageProtection();
            
            console.log('Art modal opened with protection enabled');
        });
    });

    // Close modal functions
    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        currentArtData = null;
        
        // Disable protection when modal closes
        disableImageProtection();
    }

    closeBtn.addEventListener('click', closeModal);
    closeBtnFooter.addEventListener('click', closeModal);

    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            closeModal();
        }
    });

    // Set up download button with loading animation
    downloadBtn.addEventListener('click', function() {
        if (currentArtData) {
            startDownloadAnimation();
            setTimeout(() => {
                downloadArtwork(currentArtData.image, currentArtData.title);
            }, 2000); // 2 second delay to show animation
        }
    });

    // Start dev tools detection when modal system is initialized
}

    // Start download button animation
    function startDownloadAnimation() {
        const downloadBtn = document.getElementById('download-art');
        const originalText = downloadBtn.innerHTML;
        let dots = 0;
        
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = 'Downloading';
        
        const interval = setInterval(() => {
            dots = (dots + 1) % 4;
            downloadBtn.innerHTML = 'Downloading' + '.'.repeat(dots);
        }, 500);
        
        // Store interval ID to clear later
        downloadBtn.dataset.intervalId = interval;
    }

    // Stop download button animation
    function stopDownloadAnimation() {
        const downloadBtn = document.getElementById('download-art');
        const intervalId = downloadBtn.dataset.intervalId;
        
        if (intervalId) {
            clearInterval(intervalId);
            downloadBtn.removeAttribute('data-interval-id');
        }
        
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = '📥 Download Artwork';
    }

    // Load download statistics from Firebase
    function loadDownloadStats(artTitle) {
        if (!database || !firebaseInitialized) {
            console.log('Firebase not available for loading download stats');
            // Set default values when Firebase is not available
            updateQualityDisplay(0, 100, 'premium');
            return;
        }
        
        const statsRef = database.ref('downloadStats/' + encodeArtTitle(artTitle));
        statsRef.once('value').then((snapshot) => {
            const stats = snapshot.val();
            const downloadCount = stats ? stats.downloadCount || 0 : 0;
            const quality = calculateQuality(downloadCount);
            const qualityTier = getQualityTier(quality);
            
            // Update display with enhanced styling
            updateQualityDisplay(downloadCount, quality, qualityTier);
            
        }).catch((error) => {
            console.error('Error loading download stats:', error);
            // Fallback display
            updateQualityDisplay(0, 100, 'premium');
        });
    }

    // Update quality display with enhanced styling
    function updateQualityDisplay(downloadCount, quality, qualityTier) {
        const downloadValue = document.getElementById('download-value');
        const qualityValue = document.getElementById('quality-value');
        const currentQuality = document.getElementById('current-quality');
        const nextDrop = document.getElementById('next-drop');
        const qualityProgress = document.querySelector('.quality-progress-bar');
        
        if (downloadValue) downloadValue.textContent = downloadCount;
        if (qualityValue) {
            qualityValue.textContent = quality + '%';
            qualityValue.className = '';
            qualityValue.classList.add(`quality-${qualityTier}`);
            
            // Add pulse animation for low quality
            if (qualityTier === 'low') {
                qualityValue.classList.add('quality-pulse');
            } else {
                qualityValue.classList.remove('quality-pulse');
            }
        }
        
        if (currentQuality) {
            currentQuality.textContent = quality + '%';
        }
        
        // Calculate downloads until next quality drop - UPDATED FOR 10% MESSAGE
        if (nextDrop) {
            if (quality <= 10) {
                nextDrop.textContent = 'Waiting for artist to revive';
                nextDrop.style.color = '#ff6b6b';
                nextDrop.style.fontSize = '12px';
            } else {
                const downloadsUntilNextDrop = 5 - (downloadCount % 5);
                nextDrop.textContent = downloadsUntilNextDrop;
                nextDrop.style.color = '';
                nextDrop.style.fontSize = '';
            }
        }
        
        // Update progress bar
        if (qualityProgress) {
            qualityProgress.style.width = quality + '%';
            qualityProgress.className = 'quality-progress-bar';
            if (qualityTier === 'medium') qualityProgress.classList.add('medium');
            if (qualityTier === 'low') qualityProgress.classList.add('low');
        }
        
        // Update tier badge
        updateQualityTierBadge(qualityTier);
    }

    // Update quality tier badge
    function updateQualityTierBadge(tier) {
        let tierElement = document.getElementById('quality-tier');
        if (!tierElement) {
            tierElement = document.createElement('span');
            tierElement.id = 'quality-tier';
            tierElement.className = 'quality-tier';
            const qualityText = document.querySelector('.quality-text');
            if (qualityText) {
                qualityText.appendChild(tierElement);
            }
        }
        
        tierElement.className = `quality-tier tier-${tier}`;
        
        const tierNames = {
            'premium': 'PREMIUM QUALITY',
            'medium': 'STANDARD QUALITY', 
            'low': 'BASIC QUALITY'
        };
        
        tierElement.textContent = tierNames[tier] || 'UNKNOWN';
    }

    // Encode art title for Firebase key
    function encodeArtTitle(title) {
        return title.replace(/[.#$\/\[\]]/g, '_');
    }

    // Calculate quality based on download count
    function calculateQuality(downloadCount) {
        // Quality decreases by 10% every 5 downloads, minimum 10%
        const quality = Math.max(10, 100 - Math.floor(downloadCount / 5) * 10);
        return quality;
    }

    // Get quality tier based on percentage
    function getQualityTier(quality) {
        if (quality >= 80) return 'premium';
        if (quality >= 50) return 'medium';
        return 'low';
    }

    // Download artwork function with quality degradation
    function downloadArtwork(imageUrl, title) {
        if (!currentArtData) return;
        
        // Get current download stats
        const encodedTitle = encodeArtTitle(title);
        
        let downloadPromise;
        
        if (database && firebaseInitialized) {
            const statsRef = database.ref('downloadStats/' + encodedTitle);
            downloadPromise = statsRef.once('value').then((snapshot) => {
                const stats = snapshot.val() || { downloadCount: 0 };
                const newDownloadCount = stats.downloadCount + 1;
                
                // Update download count in Firebase
                return statsRef.set({
                    downloadCount: newDownloadCount,
                    lastDownloaded: new Date().toISOString(),
                    totalDownloads: (stats.totalDownloads || 0) + 1
                }).then(() => newDownloadCount);
            }).catch((error) => {
                console.error('Error updating download stats:', error);
                return 1; // Fallback to 1 download if Firebase fails
            });
        } else {
            // Firebase not available, use local storage as fallback
            const localKey = 'downloadStats_' + encodedTitle;
            const localStats = JSON.parse(localStorage.getItem(localKey) || '{"downloadCount":0}');
            const newDownloadCount = localStats.downloadCount + 1;
            localStats.downloadCount = newDownloadCount;
            localStats.lastDownloaded = new Date().toISOString();
            localStorage.setItem(localKey, JSON.stringify(localStats));
            downloadPromise = Promise.resolve(newDownloadCount);
        }
        
        downloadPromise.then((downloadCount) => {
            const quality = calculateQuality(downloadCount);
            const qualityTier = getQualityTier(quality);
            
            // Create canvas for quality adjustment
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Calculate new dimensions based on quality
                const scale = quality / 100;
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                
                // Draw image with reduced quality
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                // Convert to blob with reduced quality
                canvas.toBlob(function(blob) {
                    // Create download link
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${title.replace(/\s+/g, '_')}_${quality}%_quality.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    // Clean up URL
                    setTimeout(() => URL.revokeObjectURL(url), 100);
                    
                    // Update display
                    updateQualityDisplay(downloadCount, quality, qualityTier);
                    
                    // Stop download animation
                    stopDownloadAnimation();
                    
                    // Show download confirmation with donation links
                    showDownloadConfirmation(title, quality, qualityTier, downloadCount);
                    
                    // Track download in analytics if Firebase is available
                    if (database && firebaseInitialized) {
                        trackDownloadAnalytics(title, quality, downloadCount);
                    }
                    
                }, 'image/png', 0.9);
            };
            img.onerror = function() {
                // Fallback to original download if canvas manipulation fails
                const link = document.createElement('a');
                link.href = imageUrl;
                link.download = `${title.replace(/\s+/g, '_')}_${quality}%_quality.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // Update display and show confirmation
                updateQualityDisplay(downloadCount, quality, qualityTier);
                
                // Stop download animation
                stopDownloadAnimation();
                
                showDownloadConfirmation(title, quality, qualityTier, downloadCount);
                
                if (database && firebaseInitialized) {
                    trackDownloadAnalytics(title, quality, downloadCount);
                }
            };
            img.src = imageUrl;
        }).catch((error) => {
            console.error('Error in download process:', error);
            // Final fallback - simple download
            const link = document.createElement('a');
            link.href = imageUrl;
            link.download = `${title.replace(/\s+/g, '_')}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Stop download animation
            stopDownloadAnimation();
            
            showDownloadConfirmation(title, 100, 'premium', 1);
        });
    }

    // Track download analytics
    function trackDownloadAnalytics(title, quality, downloadCount) {
        if (!database || !firebaseInitialized) return;
        
        const analyticsRef = database.ref('downloadAnalytics').push();
        analyticsRef.set({
            artwork: title,
            quality: quality,
            downloadCount: downloadCount,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            language: navigator.language
        }).catch(error => {
            console.error('Error tracking analytics:', error);
        });
    }

    // Show enhanced download confirmation with donation links and proper logos
    // Show enhanced download confirmation with donation links and proper logos
function showDownloadConfirmation(title, quality, qualityTier, downloadCount) {
    // Create custom confirmation with donation links
    const confirmationOverlay = document.createElement('div');
    confirmationOverlay.className = 'art-alert-overlay download-confirmation-overlay';
    confirmationOverlay.innerHTML = `
        <div class="art-alert download-complete-modal mobile-optimized">
            <div class="art-alert-header download-complete-header">
                <h3>🎨 Download Complete!</h3>
                <span class="art-alert-close download-complete-close">&times;</span>
            </div>
            <div class="art-alert-body download-complete-body">
                <p class="download-artwork-title">"${title}"</p>
                <div class="download-stats-container">
                    <div class="download-stat-row">
                        <span class="download-stat-label">Quality:</span>
                        <span class="download-stat-value quality-stat-value quality-${qualityTier}">${quality}%</span>
                    </div>
                    <div class="download-stat-row">
                        <span class="download-stat-label">Total Downloads:</span>
                        <span class="download-stat-value" style="color: #4caf50;">${downloadCount}</span>
                    </div>
                </div>
                
                <div class="support-artist-section">
                    <h4 class="support-artist-title">💝 Support the Artist</h4>
                    <p style="color: #ccc; margin-bottom: 20px; font-size: 14px;">Thank you for your support! Your contribution helps create more amazing artwork.</p>
                    
                    <div class="donation-platforms">
                        <div class="donation-platform" onclick="showZelleQR()">
                            <div class="platform-icon">💜</div>
                            <div class="platform-name">Zelle</div>
                            <div class="platform-username">QR Code Only</div>
                            <div style="font-size: 10px; color: #888; margin-top: 5px;">(Tap to view QR)</div>
                        </div>
                        <div class="donation-platform" onclick="copyToClipboard('Devil0fish', 'Venmo')">
                            <div class="platform-icon">💙</div>
                            <div class="platform-name">Venmo</div>
                            <div class="platform-username">@Devil0fish</div>
                            <div style="font-size: 10px; color: #888; margin-top: 5px;">(Tap to copy)</div>
                        </div>
                        <div class="donation-platform" onclick="copyToClipboard('$devil0fish', 'Cash App')">
                            <div class="platform-icon">💚</div>
                            <div class="platform-name">Cash App</div>
                            <div class="platform-username">$devil0fish</div>
                            <div style="font-size: 10px; color: #888; margin-top: 5px;">(Tap to copy)</div>
                        </div>
                        <div class="donation-platform" onclick="window.open('https://www.instagram.com/teeth.grind?igsh=MTNvMW9yMHgxaTVxMQ%3D%3D&utm_source=qr', '_blank')">
                            <div class="platform-icon">📷</div>
                            <div class="platform-name">Instagram</div>
                            <div class="platform-username">@teeth.grind</div>
                            <div style="font-size: 10px; color: #888; margin-top: 5px;">(Tap to follow)</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="art-alert-footer download-complete-footer">
                <button class="art-alert-button continue-button">Continue Browsing</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(confirmationOverlay);
    
    // Store the current scroll position
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    
    // Add event listeners
    const closeBtn = confirmationOverlay.querySelector('.download-complete-close');
    const okBtn = confirmationOverlay.querySelector('.continue-button');
    
    const closeAlert = () => {
        // Restore scroll position
        const scrollY = document.body.style.top;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
        
        confirmationOverlay.remove();
    };
    
    closeBtn.addEventListener('click', closeAlert);
    okBtn.addEventListener('click', closeAlert);
    confirmationOverlay.addEventListener('click', (e) => {
        if (e.target === confirmationOverlay) closeAlert();
    });
    
    // Close with Escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeAlert();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
    
    // Clean up event listener when modal closes
    confirmationOverlay.addEventListener('click', (e) => {
        if (e.target === confirmationOverlay) {
            document.removeEventListener('keydown', handleEscape);
        }
    });
}

    // Show Zelle QR code modal
    // Show Zelle QR code modal
window.showZelleQR = function() {
    const qrOverlay = document.createElement('div');
    qrOverlay.className = 'art-alert-overlay download-confirmation-overlay';
    qrOverlay.innerHTML = `
        <div class="art-alert mobile-optimized" style="max-width: 300px;">
            <div class="art-alert-header">
                <h3>Zelle QR Code</h3>
                <span class="art-alert-close">&times;</span>
            </div>
            <div class="art-alert-body" style="text-align: center;">
                <p style="color: #ccc; margin-bottom: 20px;">Scan with your banking app to send via Zelle</p>
                <div style="background: white; padding: 20px; border-radius: 12px; display: inline-block;">
                    <div style="width: 200px; height: 200px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; border-radius: 8px;">
                        <img src="images/qr.png" style="width:250px; height:auto;"></img>
                    </div>
                </div>
                <p style="color: #888; font-size: 12px; margin-top: 15px;">Use your banking app's Zelle feature to scan this code</p>
            </div>
            <div class="art-alert-footer">
                <button class="art-alert-button">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(qrOverlay);
    
    // Store the current scroll position
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    
    // Add event listeners
    const closeBtn = qrOverlay.querySelector('.art-alert-close');
    const okBtn = qrOverlay.querySelector('.art-alert-button');
    
    const closeAlert = () => {
        // Restore scroll position
        const scrollY = document.body.style.top;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
        
        qrOverlay.remove();
    };
    
    closeBtn.addEventListener('click', closeAlert);
    okBtn.addEventListener('click', closeAlert);
    qrOverlay.addEventListener('click', (e) => {
        if (e.target === qrOverlay) closeAlert();
    });
};

    // Copy to clipboard function
    window.copyToClipboard = function(text, platform) {
        navigator.clipboard.writeText(text).then(() => {
            // Show copy notification
            const notification = document.createElement('div');
            notification.className = 'copy-notification';
            notification.textContent = `${platform} info copied to clipboard!`;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }).catch(err => {
            console.error('Failed to copy: ', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            const notification = document.createElement('div');
            notification.className = 'copy-notification';
            notification.textContent = `${platform} info copied to clipboard!`;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 3000);
        });
    };

    // Load configuration from Firebase with real-time updates
    function loadArtConfig() {
        if (!database || !firebaseInitialized) {
            console.log('Firebase not available for loading art config');
            // Use default config when Firebase is not available
            currentConfig = {
                START_DATE: null,
                END_DATE: null,
                IS_VISIBLE: true, // Default to visible when Firebase fails
                MANUAL_CONTROL: false
            };
            initializeArtSection();
            return;
        }
        
        database.ref('artConfig').on('value', (snapshot) => {
            const config = snapshot.val();
            currentConfig = config;
            
            if (config) {
                initializeArtSection();
            } else {
                // No config found - set default
                const defaultConfig = {
                    START_DATE: null,
                    END_DATE: null,
                    IS_VISIBLE: false,
                    MANUAL_CONTROL: false,
                    lastUpdated: new Date().toISOString()
                };
                database.ref('artConfig').set(defaultConfig).catch(error => {
                    console.error('Error setting default config:', error);
                });
            }
        }, (error) => {
            console.error('Error loading art config:', error);
            // Fallback to default config
            currentConfig = {
                START_DATE: null,
                END_DATE: null,
                IS_VISIBLE: true, // Default to visible when Firebase fails
                MANUAL_CONTROL: false
            };
            initializeArtSection();
        });
    }

    // Convert UTC time to visitor's local time
    function convertToLocalTime(utcDateString) {
        if (!utcDateString) return null;
        const date = new Date(utcDateString);
        // The date is already in local time because datetime-local inputs work in local time
        return date;
    }

    // Check if art should be available (using visitor's local time)
    function isArtAvailable() {
        if (!currentConfig) return true; // Default to available if no config
        
        if (currentConfig.MANUAL_CONTROL) {
            return currentConfig.IS_VISIBLE;
        }
        
        if (!currentConfig.IS_VISIBLE) return false;
        
        const now = new Date(); // Visitor's local time
        const startDate = currentConfig.START_DATE ? convertToLocalTime(currentConfig.START_DATE) : null;
        const endDate = currentConfig.END_DATE ? convertToLocalTime(currentConfig.END_DATE) : null;
        
        // If no dates set and manual control is off, use IS_VISIBLE flag
        if (!startDate && !endDate) {
            return currentConfig.IS_VISIBLE;
        }
        
        // Check timeframe using visitor's local time
        if (startDate && now < startDate) return false;
        if (endDate && now > endDate) return false;
        
        return true;
    }

    // Format date for display in visitor's timezone
    function formatDisplayDate(dateString) {
        if (!dateString) return '';
        try {
            const date = convertToLocalTime(dateString);
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    }

    // Get time until/left in readable format (improved)
    function getTimeUntil(targetDate, isTimeLeft = false) {
        const now = new Date();
        const diff = targetDate - now;
        
        if (diff <= 0) {
            return isTimeLeft ? ' - Ending soon' : ' - Starting soon';
        }
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        const prefix = isTimeLeft ? ' - ' : ' - ';
        const suffix = isTimeLeft ? ' left' : '';
        
        if (days > 0) {
            return `${prefix}${days} day${days !== 1 ? 's' : ''}${suffix}`;
        } else if (hours > 0) {
            return `${prefix}${hours} hour${hours !== 1 ? 's' : ''}${suffix}`;
        } else if (minutes > 0) {
            return `${prefix}${minutes} minute${minutes !== 1 ? 's' : ''}${suffix}`;
        } else {
            return `${prefix}Less than a minute${suffix}`;
        }
    }

    // Update availability text
    function updateAvailabilityText() {
        if (!currentConfig) {
            const availabilityText = document.querySelector('.hero .under.semibold');
            if (availabilityText) {
                availabilityText.innerHTML = 'Exclusive Art Pieces From Me';
                availabilityText.style.color = '#4caf50';
            }
            return;
        }
        
        const now = new Date();
        const startDate = currentConfig.START_DATE ? convertToLocalTime(currentConfig.START_DATE) : null;
        const endDate = currentConfig.END_DATE ? convertToLocalTime(currentConfig.END_DATE) : null;
        const availabilityText = document.querySelector('.hero .under.semibold');
        
        if (!availabilityText) return;

        if (currentConfig.MANUAL_CONTROL) {
            availabilityText.innerHTML = currentConfig.IS_VISIBLE ? 
                'Gallery is currently active' : 
                'Gallery is currently not available';
            availabilityText.style.color = currentConfig.IS_VISIBLE ? '#4caf50' : '#ff6b6b';
        } else if (!currentConfig.IS_VISIBLE) {
            availabilityText.innerHTML = 'My gallery is currently unavailable. Check back soon!';
            availabilityText.style.color = '#ccc';
        } else if (startDate && now < startDate) {
            // Art hasn't started yet
            const timeUntil = getTimeUntil(startDate);
            availabilityText.innerHTML = `Almost There! Available starting ${formatDisplayDate(currentConfig.START_DATE)}${timeUntil}`;
            availabilityText.style.color = '#ccc';
        } else if (endDate && now > endDate) {
            // Art has ended
            availabilityText.innerHTML = 'My gallery is currently unavailable. Check back soon!';
            availabilityText.style.color = '#ccc';
        } else {
            // Art is currently available
            const timeLeft = endDate ? getTimeUntil(endDate, true) : '';
            if (timeLeft.includes('soon')) {
                availabilityText.innerHTML = `Exclusive Art Pieces From Me - Ending soon`;
            } else {
                availabilityText.innerHTML = `Exclusive Art Pieces From Me${timeLeft}`;
            }
            availabilityText.style.color = '#4caf50';
        }
    }

    // Show custom art alert
    function showArtAlert() {
        if (!currentConfig) {
            // Default alert when no config
            const alertOverlay = document.createElement('div');
            alertOverlay.className = 'art-alert-overlay';
            alertOverlay.innerHTML = `
                <div class="art-alert">
                    <div class="art-alert-header">
                        <h3>Gallery Available</h3>
                        <span class="art-alert-close">&times;</span>
                    </div>
                    <div class="art-alert-body">
                        <p>The art gallery is currently available to view.</p>
                    </div>
                    <div class="art-alert-footer">
                        <button class="art-alert-button">OK</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(alertOverlay);
            
            // Add event listeners
            const closeBtn = alertOverlay.querySelector('.art-alert-close');
            const okBtn = alertOverlay.querySelector('.art-alert-button');
            const closeAlert = () => alertOverlay.remove();
            
            closeBtn.addEventListener('click', closeAlert);
            okBtn.addEventListener('click', closeAlert);
            alertOverlay.addEventListener('click', (e) => {
                if (e.target === alertOverlay) closeAlert();
            });
            return;
        }
        
        const now = new Date();
        const startDate = currentConfig.START_DATE ? convertToLocalTime(currentConfig.START_DATE) : null;
        const endDate = currentConfig.END_DATE ? convertToLocalTime(currentConfig.END_DATE) : null;
        
        let message, title;
        
        if (currentConfig.MANUAL_CONTROL) {
            title = currentConfig.IS_VISIBLE ? 'Gallery Active' : 'Gallery Unavailable';
            message = currentConfig.IS_VISIBLE ? 
                'The gallery is currently active' : 
                'The gallery is currently not available';
        } else if (!currentConfig.IS_VISIBLE) {
            title = 'Exhibition';
            message = 'The art gallery is currently not available to visitors. Check back soon!';
        } else if (startDate && now < startDate) {
            title = 'Coming Soon!';
            message = `The artwork collection will be available starting ${formatDisplayDate(currentConfig.START_DATE)}.`;
        } else {
            title = 'Exhibition Ended';
            message = 'This artwork collection has ended. Stay tuned for future exhibitions!';
        }
        
        // Create custom alert
        const alertOverlay = document.createElement('div');
        alertOverlay.className = 'art-alert-overlay';
        alertOverlay.innerHTML = `
            <div class="art-alert">
                <div class="art-alert-header">
                    <h3>${title}</h3>
                    <span class="art-alert-close">&times;</span>
                </div>
                <div class="art-alert-body">
                    <p>${message}</p>
                </div>
                <div class="art-alert-footer">
                    <button class="art-alert-button">OK</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(alertOverlay);
        
        // Add event listeners
        const closeBtn = alertOverlay.querySelector('.art-alert-close');
        const okBtn = alertOverlay.querySelector('.art-alert-button');
        const closeAlert = () => alertOverlay.remove();
        
        closeBtn.addEventListener('click', closeAlert);
        okBtn.addEventListener('click', closeAlert);
        alertOverlay.addEventListener('click', (e) => {
            if (e.target === alertOverlay) closeAlert();
        });
    }

    // Handle Start Now button click
    function handleStartNowClick(e) {
        e.preventDefault();
        
        if (isArtAvailable()) {
            // Scroll to art section
            const artSection = document.getElementById('features');
            if (artSection) {
                artSection.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            // Show custom alert
            showArtAlert();
        }
    }

    // Initialize art section visibility and spacing
    function initializeArtSection() {
        // Update availability text
        updateAvailabilityText();
        
        const artSection = document.querySelector('.art-display');
        if (!artSection) return;

        // Show/hide art section based on availability
        if (isArtAvailable()) {
            artSection.style.display = 'flex';
            // Remove spacer if art is available
            const spacer = document.querySelector('.art-section-spacer');
            if (spacer) {
                spacer.remove();
            }
        } else {
            artSection.style.display = 'none';
        }
        
        // Add event listener to Start Now button
        const startNowButton = document.querySelector('.waitlistbutton');
        if (startNowButton) {
            startNowButton.removeEventListener('click', handleStartNowClick); // Remove existing to avoid duplicates
            startNowButton.addEventListener('click', handleStartNowClick);
        }
    }

    // Set up real-time monitoring for automatic updates
    function setupRealTimeMonitoring() {
        // Check every 30 seconds for changes
        setInterval(() => {
            if (currentConfig) {
                initializeArtSection();
                updateAvailabilityText();
            }
        }, 30000); // Check every 30 seconds
        
        // Also check when the page becomes visible again
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden && currentConfig) {
                initializeArtSection();
                updateAvailabilityText();
            }
        });
    }

    // Meteor and background stars functions
    function createBackgroundStars(container, count) {
        for (let i = 0; i < count; i++) {
            const star = document.createElement('div');
            star.className = 'background-star';
            
            const posX = Math.random() * 100;
            const posY = Math.random() * 100;
            const opacity = 0.3 + Math.random() * 0.7;
            const duration = 2 + Math.random() * 2;
            const delay = Math.random() * 5;
            
            star.style.cssText = `
                left: ${posX}%;
                top: ${posY}%;
                --twinkle-opacity: ${opacity};
                --twinkle-duration: ${duration}s;
                animation-delay: ${delay}s;
            `;
            
            container.appendChild(star);
        }
    }
    
    function createMeteor(container, index) {
        const spawnX = Math.random() * 100;
        const spawnY = -10 - (Math.random() * 20);
        const angle = 25 + Math.random() * 10;
        const distanceX = 200 + Math.random() * 150;
        const distanceY = 50 + Math.random() * 50;
        const tailLength = 60 + Math.random() * 40;
        const shineWidth = 20 + Math.random() * 20;
        const duration = 2 + Math.random();
        const delay = Math.random() * 15;
        
        const meteor = document.createElement('div');
        meteor.className = 'meteor';
        
        meteor.style.cssText = `
            --angle: ${angle}deg;
            --distance-x: ${distanceX}px;
            --distance-y: ${distanceY}px;
            --tail-length: ${tailLength}px;
            --shine-width: ${shineWidth}px;
            --duration: ${duration}s;
            --delay: ${delay}s;
            top: ${spawnY}px;
            left: ${spawnX}%;
        `;
        
        container.appendChild(meteor);
        
        const totalTime = (delay + duration) * 1000;
        setTimeout(() => {
            meteor.remove();
            setTimeout(() => createMeteor(container, index), 1000 + Math.random() * 4000);
        }, totalTime);
    }

    // Mobile menu functionality
    function initializeMobileMenu() {
        const mobileMenu = document.getElementById('mobile-menu');
        const navLinks = document.querySelector('.nav-links');

        if (mobileMenu && navLinks) {
            mobileMenu.addEventListener('click', function() {
                this.classList.toggle('active');
                navLinks.classList.toggle('active');
                document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
            });

            document.querySelectorAll('.nav-links a').forEach(link => {
                link.addEventListener('click', (e) => {
                    if (window.innerWidth <= 768) {
                        e.preventDefault();
                        mobileMenu.classList.remove('active');
                        navLinks.classList.remove('active');
                        document.body.style.overflow = '';
                        
                        setTimeout(() => {
                            const target = document.querySelector(link.getAttribute('href'));
                            if (target) {
                                target.scrollIntoView({ behavior: 'smooth' });
                            }
                        }, 400);
                    }
                });
            });

            document.addEventListener('click', (e) => {
                if (window.innerWidth <= 768 && 
                    !e.target.closest('nav') && 
                    navLinks.classList.contains('active')) {
                    mobileMenu.classList.remove('active');
                    navLinks.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });

            window.addEventListener('resize', () => {
                if (window.innerWidth > 768) {
                    mobileMenu.classList.remove('active');
                    navLinks.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        }
    }

    // FAQ functionality
    function initializeFAQ() {
        const questions = document.querySelectorAll('.question');
        
        questions.forEach(question => {
            const header = question.querySelector('.question-header');
            const answer = question.querySelector('.question-answer');
            const toggle = question.querySelector('.question-toggle');
            
            header.addEventListener('click', function() {
                questions.forEach(q => {
                    if (q !== question) {
                        q.classList.remove('active');
                        q.querySelector('.question-answer').style.maxHeight = null;
                        q.querySelector('.question-toggle').textContent = '+';
                    }
                });
                
                const isActive = question.classList.toggle('active');
                
                if (isActive) {
                    answer.style.maxHeight = answer.scrollHeight + 'px';
                    toggle.textContent = '×';
                } else {
                    answer.style.maxHeight = null;
                    toggle.textContent = '+';
                }
            });
        });
    }

    // Scroll animation functionality
    function animateOnScroll() {
        const elements = document.querySelectorAll('.scroll-animate');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fade-up');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        });

        elements.forEach(element => {
            observer.observe(element);
        });
    }

    // Initialize everything
    function initializeAll() {
        // Create background elements
        createBackgroundStars(container, 150);
        
        for (let i = 0; i < meteorCount; i++) {
            createMeteor(container, i);
        }

        // Load configuration and initialize
        loadArtConfig();
        initializeArtModal(); // Initialize art modal
        initializeMobileMenu();
        initializeFAQ();
        animateOnScroll();
        setupRealTimeMonitoring(); // Add real-time monitoring

        // Additional event listeners
        window.addEventListener('load', animateOnScroll);
        window.addEventListener('resize', animateOnScroll);
        setTimeout(animateOnScroll, 500);
    }

    // Start the initialization
    initializeAll();
});