// Toggle dropdown menu when clicking the account icon
document.addEventListener('DOMContentLoaded', function() {
    const accountIcon = document.querySelector('.account-icon');
    const dropdown = document.querySelector('.account-dropdown');

    if (accountIcon) {
        // Toggle dropdown on click
        accountIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!accountIcon.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
    }

    // Fix the contact link - remove the duplicate 'pages' in the path
    const contactLink = document.querySelector('.account-dropdown a[href^="pages/"]');
    if (contactLink) {
        contactLink.setAttribute('href', 'contactus.html');
    }
});
