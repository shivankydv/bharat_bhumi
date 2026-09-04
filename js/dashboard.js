/**
 * Bharat Bhumi
 * Citizen Dashboard Controller
 *
 * Responsibilities:
 * - Protect dashboard with authentication guard
 * - Display logged-in citizen information
 * - Handle logout
 * - Handle ULPIN/property search
 * - Handle property detail actions
 * - Handle dashboard quick actions
 * - Provide demo application/payment/dispute flows
 * - Provide demo GIS and activity interactions
 *
 * NOTE:
 * All dashboard data below is FRONTEND DEMO DATA.
 * It can later be replaced with Spring Boot API responses.
 */

import {
  isAuthenticated,
  getCurrentUser,
  logout
} from './services/auth-service.js';


// ============================================================
// DEMO DATA
// ============================================================

export const SAMPLE_DASHBOARD_STATS = {
  totalProperties: 3,
  verifiedUlpins: 2,
  activeApplications: 1
};


export const SAMPLE_PROPERTIES = [
  {
    ulpin: 'ULP-892-441-A',
    type: 'Agricultural',
    location: 'Plot 42, North Sector, District A',
    area: '2.4 Hectares',
    status: 'Verified'
  },
  {
    ulpin: 'ULP-110-398-B',
    type: 'Residential',
    location: 'Block C, Metro Layout, District B',
    area: '1200 Sq. Ft.',
    status: 'Verified'
  },
  {
    ulpin: 'Pending ID...',
    type: 'Commercial',
    location: 'Plot 5, Market Road, District A',
    area: '0.5 Hectares',
    status: 'Under Review'
  }
];


export const SAMPLE_ACTIVITIES = [
  {
    time: 'Today, 10:42 AM',
    title: 'Tax Payment Successful',
    description:
      'Receipt #TRX-9982 generated for ULP-892-441-A',
    color: '#16a34a'
  },
  {
    time: 'Yesterday, 14:15 PM',
    title: 'Document Downloaded',
    description:
      'Encumbrance Certificate downloaded for ULP-110-398-B',
    color: '#001b44'
  },
  {
    time: 'Oct 12, 2023',
    title: 'Application Submitted',
    description:
      'Mutation request APP-2023-11 filed for new property.',
    color: '#ea580c'
  }
];


// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  // ----------------------------------------------------------
  // 1. AUTHENTICATION GUARD
  // ----------------------------------------------------------

  if (!isAuthenticated()) {

    console.warn(
      '[Dashboard Guard] Unauthenticated access attempt.'
    );

    window.location.href = 'login.html';

    return;
  }


  // ----------------------------------------------------------
  // 2. GET CURRENT USER
  // ----------------------------------------------------------

  const user = getCurrentUser();

  const displayName =
    user?.name ||
    user?.username ||
    'Citizen';

  const username =
    user?.username ||
    'Citizen';

  const role =
    user?.role ||
    'USER';


  console.log(
    `[Dashboard] Initialized for ${username} (${role})`
  );


  // ----------------------------------------------------------
  // 3. USER PROFILE
  // ----------------------------------------------------------

  setupUserProfile(displayName, role);


  // ----------------------------------------------------------
  // 4. DASHBOARD STATS
  // ----------------------------------------------------------

  setupDashboardStats();


  // ----------------------------------------------------------
  // 5. LOGOUT
  // ----------------------------------------------------------

  setupLogout();


  // ----------------------------------------------------------
  // 6. QUICK ACTIONS
  // ----------------------------------------------------------

  setupQuickActions();


  // ----------------------------------------------------------
  // 7. ULPIN SEARCH
  // ----------------------------------------------------------

  setupUlpINSearch();


  // ----------------------------------------------------------
  // 8. PROPERTY ACTIONS
  // ----------------------------------------------------------

  setupPropertyActions();


  // ----------------------------------------------------------
  // 9. NAVIGATION PLACEHOLDERS
  // ----------------------------------------------------------

  setupNavigation();


  console.log('[Dashboard] Ready.');
});


// ============================================================
// USER PROFILE
// ============================================================

function setupUserProfile(displayName, role) {

  // Welcome card

  const welcomeHeading =
    document.getElementById('user-welcome-name');

  if (welcomeHeading) {

    welcomeHeading.textContent =
      `Welcome back, ${displayName}`;
  }


  // Sidebar portal header stays static: "Citizen Portal" / "USER • Verified Profile".


  // Top navigation

  const topNavUser =
    document.getElementById('top-nav-username');

  if (topNavUser) {

    topNavUser.textContent =
      displayName;
  }


  const topNavRoleBadge =
    document.getElementById('top-nav-role-badge');

  if (topNavRoleBadge) {

    topNavRoleBadge.textContent =
      role;
  }
}


// ============================================================
// DASHBOARD STATS
// ============================================================

function setupDashboardStats() {

  const stats =
    SAMPLE_DASHBOARD_STATS;


  // We support both IDs if you later add them to HTML.

  const totalProperties =
    document.getElementById('total-properties');

  if (totalProperties) {

    totalProperties.textContent =
      stats.totalProperties;
  }


  const verifiedUlpins =
    document.getElementById('verified-ulpins');

  if (verifiedUlpins) {

    verifiedUlpins.textContent =
      stats.verifiedUlpins;
  }


  const activeApplications =
    document.getElementById('active-applications');

  if (activeApplications) {

    activeApplications.textContent =
      stats.activeApplications;
  }
}


// ============================================================
// LOGOUT
// ============================================================

function setupLogout() {

  const sidebarLogout =
    document.getElementById('btn-sidebar-logout');


  if (sidebarLogout) {

    sidebarLogout.addEventListener(
      'click',
      (event) => {

        event.preventDefault();

        console.log(
          '[Dashboard] Sidebar logout clicked.'
        );

        logout('login.html');
      }
    );
  }


  const topNavLogout =
    document.getElementById('btn-topnav-logout');


  if (topNavLogout) {

    topNavLogout.addEventListener(
      'click',
      (event) => {

        event.preventDefault();

        console.log(
          '[Dashboard] Top navigation logout clicked.'
        );

        logout('login.html');
      }
    );
  }
}


// ============================================================
// QUICK ACTIONS
// ============================================================

function setupQuickActions() {

  const buttons =
    document.querySelectorAll(
      '[data-action="quick-action"]'
    );


  buttons.forEach((button) => {

    button.addEventListener(
      'click',
      (event) => {

        event.preventDefault();


        const action =
          button.getAttribute(
            'data-action-name'
          );


        console.log(
          `[Dashboard] Action clicked: ${action}`
        );


        handleDashboardAction(action);
      }
    );
  });
}


// ============================================================
// DASHBOARD ACTION ROUTER
// ============================================================

function handleDashboardAction(action) {

  switch (action) {

    // --------------------------------------------------------
    // APPLY FOR SERVICE
    // --------------------------------------------------------

    case 'Apply for Service':

      showDemoModal(
        'Apply for Service',
        `
          <p class="text-secondary mb-4">
            Select a land service to continue.
          </p>

          <div class="space-y-3">

            <button
              class="demo-service w-full text-left p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
              data-service="Mutation of Property">

              <div class="flex items-center gap-3">

                <span class="material-symbols-outlined text-[#002F6C]">
                  edit_document
                </span>

                <div>
                  <div class="font-semibold">
                    Mutation of Property
                  </div>

                  <div class="text-sm text-gray-500">
                    Update ownership details
                  </div>
                </div>

              </div>

            </button>


            <button
              class="demo-service w-full text-left p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
              data-service="Land Record Copy">

              <div class="flex items-center gap-3">

                <span class="material-symbols-outlined text-[#002F6C]">
                  description
                </span>

                <div>
                  <div class="font-semibold">
                    Land Record Copy
                  </div>

                  <div class="text-sm text-gray-500">
                    Request certified land records
                  </div>
                </div>

              </div>

            </button>


            <button
              class="demo-service w-full text-left p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
              data-service="Encumbrance Certificate">

              <div class="flex items-center gap-3">

                <span class="material-symbols-outlined text-[#002F6C]">
                  verified_user
                </span>

                <div>
                  <div class="font-semibold">
                    Encumbrance Certificate
                  </div>

                  <div class="text-sm text-gray-500">
                    Check property encumbrances
                  </div>
                </div>

              </div>

            </button>

          </div>
        `
      );


      setTimeout(() => {

        document
          .querySelectorAll('.demo-service')
          .forEach((button) => {

            button.addEventListener(
              'click',
              () => {

                const service =
                  button.getAttribute(
                    'data-service'
                  );


                showDemoModal(
                  'Application Submitted',
                  `
                    <div class="text-center py-5">

                      <span
                        class="material-symbols-outlined text-6xl text-green-600">
                        check_circle
                      </span>

                      <h4 class="text-xl font-bold mt-3">
                        ${service}
                      </h4>

                      <p class="text-gray-500 mt-2">
                        Your demo application has been created successfully.
                      </p>

                      <div class="mt-5 p-4 bg-gray-50 rounded-lg">

                        <div class="text-sm text-gray-500">
                          Application ID
                        </div>

                        <div class="font-bold text-lg">
                          APP-2026-1042
                        </div>

                      </div>

                    </div>
                  `
                );
              }
            );
          });

      }, 50);

      break;


    // --------------------------------------------------------
    // PAY LAND TAX
    // --------------------------------------------------------

    case 'Pay Land Tax':

      showDemoModal(
        'Pay Land Tax',
        `
          <div class="space-y-4">

            <div class="p-4 bg-gray-50 rounded-lg">

              <div class="text-sm text-gray-500">
                Property
              </div>

              <div class="font-semibold">
                ULP-892-441-A
              </div>

            </div>


            <div class="p-4 bg-gray-50 rounded-lg">

              <div class="text-sm text-gray-500">
                Property Type
              </div>

              <div class="font-semibold">
                Agricultural
              </div>

            </div>


            <div class="p-4 bg-gray-50 rounded-lg">

              <div class="text-sm text-gray-500">
                Outstanding Land Tax
              </div>

              <div class="text-3xl font-bold text-[#002F6C]">
                ₹4,850
              </div>

            </div>


            <button
              id="demo-payment-button"
              class="w-full bg-[#002F6C] hover:bg-[#001f49] text-white py-3 rounded-lg font-semibold transition">

              Pay ₹4,850

            </button>

          </div>
        `
      );


      setTimeout(() => {

        const paymentButton =
          document.getElementById(
            'demo-payment-button'
          );


        if (!paymentButton) return;


        paymentButton.addEventListener(
          'click',
          () => {

            showDemoModal(
              'Payment Successful',
              `
                <div class="text-center py-5">

                  <span
                    class="material-symbols-outlined text-6xl text-green-600">
                    check_circle
                  </span>

                  <h4 class="text-xl font-bold mt-3">
                    Payment Successful
                  </h4>

                  <p class="text-gray-500 mt-2">
                    Your land tax payment has been recorded.
                  </p>


                  <div class="mt-5 p-4 bg-green-50 rounded-lg">

                    <div class="text-sm text-gray-500">
                      Transaction ID
                    </div>

                    <div class="font-bold">
                      TRX-9982
                    </div>

                  </div>


                  <div class="mt-3 text-sm text-gray-500">
                    Amount Paid: ₹4,850
                  </div>

                </div>
              `
            );

          }
        );

      }, 50);

      break;


    // --------------------------------------------------------
    // FILE DISPUTE
    // --------------------------------------------------------

    case 'File Dispute':

      showDemoModal(
        'File Property Dispute',
        `
          <div class="space-y-4">

            <div>

              <label class="block text-sm font-semibold mb-1">
                Property
              </label>

              <select
                id="dispute-property"
                class="w-full border border-gray-300 rounded-lg p-3 bg-white">

                <option>
                  ULP-892-441-A
                </option>

                <option>
                  ULP-110-398-B
                </option>

              </select>

            </div>


            <div>

              <label class="block text-sm font-semibold mb-1">
                Dispute Type
              </label>

              <select
                id="dispute-type"
                class="w-full border border-gray-300 rounded-lg p-3 bg-white">

                <option>
                  Ownership Dispute
                </option>

                <option>
                  Boundary Dispute
                </option>

                <option>
                  Record Correction
                </option>

                <option>
                  Other
                </option>

              </select>

            </div>


            <div>

              <label class="block text-sm font-semibold mb-1">
                Description
              </label>

              <textarea
                id="dispute-description"
                rows="4"
                class="w-full border border-gray-300 rounded-lg p-3"
                placeholder="Describe the issue..."></textarea>

            </div>


            <button
              id="submit-dispute"
              class="w-full bg-[#002F6C] hover:bg-[#001f49] text-white py-3 rounded-lg font-semibold transition">

              Submit Dispute

            </button>

          </div>
        `
      );


      setTimeout(() => {

        const submitButton =
          document.getElementById(
            'submit-dispute'
          );


        if (!submitButton) return;


        submitButton.addEventListener(
          'click',
          () => {

            const description =
              document.getElementById(
                'dispute-description'
              );


            if (
              description &&
              !description.value.trim()
            ) {

              description.focus();

              description.classList.add(
                'border-red-500'
              );

              return;
            }


            showDemoModal(
              'Dispute Submitted',
              `
                <div class="text-center py-5">

                  <span
                    class="material-symbols-outlined text-6xl text-green-600">
                    check_circle
                  </span>

                  <h4 class="text-xl font-bold mt-3">
                    Dispute Filed Successfully
                  </h4>

                  <p class="text-gray-500 mt-2">
                    Your complaint has been registered.
                  </p>


                  <div class="mt-5 p-4 bg-gray-50 rounded-lg">

                    <div class="text-sm text-gray-500">
                      Reference Number
                    </div>

                    <div class="font-bold text-lg">
                      DSP-2026-0042
                    </div>

                  </div>

                </div>
              `
            );

          }
        );

      }, 50);

      break;


    // --------------------------------------------------------
    // VIEW ALL PROPERTIES
    // --------------------------------------------------------

    case 'View All Properties':

      /*
       * Your friend's My Properties page is not currently
       * guaranteed to exist in this folder.
       *
       * Therefore we show a demo message instead of sending
       * the user to a broken URL.
       *
       * Once my-properties.html exists, change this case to:
       *
       * window.location.href = 'my-properties.html';
       */

      showDemoModal(
        'My Properties',
        `
          <div class="text-center py-5">

            <span
              class="material-symbols-outlined text-6xl text-[#002F6C]">
              domain
            </span>

            <h4 class="text-xl font-bold mt-3">
              My Properties
            </h4>

            <p class="text-gray-500 mt-2">
              Your complete property portfolio will be
              available here.
            </p>

            <div class="mt-5 p-4 bg-gray-50 rounded-lg text-left">

              <div class="flex justify-between py-2 border-b">
                <span>Properties</span>
                <strong>3</strong>
              </div>

              <div class="flex justify-between py-2 border-b">
                <span>Verified ULPINs</span>
                <strong>2</strong>
              </div>

              <div class="flex justify-between py-2">
                <span>Under Review</span>
                <strong>1</strong>
              </div>

            </div>

          </div>
        `
      );

      break;


    // --------------------------------------------------------
    // NEW APPLICATION
    // --------------------------------------------------------

    case 'New Application':

      handleDashboardAction(
        'Apply for Service'
      );

      break;


    // --------------------------------------------------------
    // GIS MAP
    // --------------------------------------------------------

    case 'Open GIS Map':

      showDemoModal(
        'GIS Explorer',
        `
          <div class="text-center py-5">

            <span
              class="material-symbols-outlined text-6xl text-[#002F6C]">
              map
            </span>

            <h4 class="text-xl font-bold mt-3">
              Bharat Bhumi GIS Explorer
            </h4>

            <p class="text-gray-500 mt-2">
              Explore land parcels and property boundaries
              using the GIS system.
            </p>


            <div
              class="mt-5 h-48 rounded-lg bg-gray-100 flex items-center justify-center">

              <div class="text-center">

                <span
                  class="material-symbols-outlined text-4xl text-[#002F6C]">
                  location_on
                </span>

                <p class="font-semibold mt-2">
                  GIS Demo View
                </p>

                <p class="text-sm text-gray-500">
                  Interactive map integration
                  can be connected here.
                </p>

              </div>

            </div>

          </div>
        `
      );

      break;


    // --------------------------------------------------------
    // ACTIVITY TIMELINE
    // --------------------------------------------------------

    case 'View Full Activity Timeline':

      showDemoModal(
        'Recent Activity',
        `
          <div class="space-y-5">

            ${SAMPLE_ACTIVITIES
              .map(
                (activity) => `
                  <div class="border-l-4 pl-4"
                       style="border-color: ${activity.color}">

                    <p class="text-sm text-gray-500">
                      ${activity.time}
                    </p>

                    <p class="font-semibold mt-1">
                      ${activity.title}
                    </p>

                    <p class="text-sm text-gray-500 mt-1">
                      ${activity.description}
                    </p>

                  </div>
                `
              )
              .join('')}

          </div>
        `
      );

      break;


    // --------------------------------------------------------
    // DEFAULT
    // --------------------------------------------------------

    default:

      console.log(
        `[Dashboard] No handler defined for: ${action}`
      );

      showDemoModal(
        action || 'Dashboard Action',
        `
          <div class="text-center py-6">

            <span
              class="material-symbols-outlined text-5xl text-[#002F6C]">
              construction
            </span>

            <p class="font-semibold mt-3">
              This feature is part of the Bharat Bhumi demo.
            </p>

            <p class="text-sm text-gray-500 mt-2">
              Full functionality can be connected to
              the Spring Boot backend.
            </p>

          </div>
        `
      );

  }
}


// ============================================================
// PROPERTY DETAILS
// ============================================================

function setupPropertyActions() {

  const buttons =
    document.querySelectorAll(
      '[title="View Property"]'
    );


  buttons.forEach((button, index) => {

    button.addEventListener(
      'click',
      (event) => {

        event.preventDefault();


        const property =
          SAMPLE_PROPERTIES[index];


        if (!property) {

          console.warn(
            `[Dashboard] Property not found at index ${index}`
          );

          return;
        }


        showPropertyDetails(property);
      }
    );
  });
}


// ============================================================
// PROPERTY DETAILS MODAL
// ============================================================

function showPropertyDetails(property) {

  const statusIsVerified =
    property.status === 'Verified';


  const statusClass =
    statusIsVerified
      ? 'bg-green-100 text-green-700'
      : 'bg-orange-100 text-orange-700';


  const statusIcon =
    statusIsVerified
      ? 'check_circle'
      : 'pending';


  showDemoModal(
    'Property Details',
    `
      <div class="space-y-5">

        <div class="p-4 bg-gray-50 rounded-lg">

          <div class="text-sm text-gray-500">
            ULPIN / Property ID
          </div>

          <div class="text-xl font-bold text-[#002F6C] mt-1">
            ${property.ulpin}
          </div>

        </div>


        <div class="grid grid-cols-2 gap-4">

          <div>

            <div class="text-sm text-gray-500">
              Property Type
            </div>

            <div class="font-semibold mt-1">
              ${property.type}
            </div>

          </div>


          <div>

            <div class="text-sm text-gray-500">
              Area
            </div>

            <div class="font-semibold mt-1">
              ${property.area}
            </div>

          </div>

        </div>


        <div>

          <div class="text-sm text-gray-500">
            Location
          </div>

          <div class="font-semibold mt-1">
            ${property.location}
          </div>

        </div>


        <div>

          <div class="text-sm text-gray-500 mb-2">
            Verification Status
          </div>

          <span
            class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full ${statusClass} font-semibold">

            <span class="material-symbols-outlined text-[16px]">
              ${statusIcon}
            </span>

            ${property.status}

          </span>

        </div>


        <div class="pt-3 border-t">

          <button
            class="w-full bg-[#002F6C] hover:bg-[#001f49] text-white py-3 rounded-lg font-semibold"
            onclick="window.closeDashboardModal && window.closeDashboardModal()">

            Close

          </button>

        </div>

      </div>
    `
  );
}


// ============================================================
// ULPIN SEARCH
// ============================================================

function setupUlpINSearch() {

  /*
   * Your current Stitch HTML does not need an ID.
   * We locate the search box by its placeholder.
   */

  const input =
    document.querySelector(
      'input[placeholder="Search by ULPIN..."]'
    );


  if (!input) {

    console.warn(
      '[Dashboard] ULPIN search input not found.'
    );

    return;
  }


  input.addEventListener(
    'input',
    () => {

      const query =
        input.value
          .toLowerCase()
          .trim();


      const rows =
        document.querySelectorAll(
          'tbody tr'
        );


      rows.forEach((row) => {

        const text =
          row.textContent
            .toLowerCase();


        row.style.display =
          text.includes(query)
            ? ''
            : 'none';
      });


      console.log(
        `[Dashboard] ULPIN search: "${query}"`
      );
    }
  );
}


// ============================================================
// SIDEBAR / NAVIGATION
// ============================================================

function setupNavigation() {

  const navigationLinks =
    document.querySelectorAll(
      'aside nav a[href="#"]'
    );


  navigationLinks.forEach((link) => {

    const label =
      link
        .querySelector('span:last-child')
        ?.textContent
        ?.trim();


    if (!label) return;


    link.addEventListener(
      'click',
      (event) => {

        event.preventDefault();


        switch (label) {

          case 'My Properties':

            handleDashboardAction(
              'View All Properties'
            );

            break;


          case 'Applications':

            showDemoModal(
              'Applications',
              `
                <div class="space-y-4">

                  <div class="p-4 border rounded-lg">

                    <div class="flex justify-between">

                      <div>
                        <div class="font-semibold">
                          Mutation Request
                        </div>

                        <div class="text-sm text-gray-500">
                          APP-2026-1042
                        </div>
                      </div>

                      <span class="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                        Under Review
                      </span>

                    </div>

                  </div>


                  <div class="p-4 border rounded-lg">

                    <div class="flex justify-between">

                      <div>
                        <div class="font-semibold">
                          Land Record Copy
                        </div>

                        <div class="text-sm text-gray-500">
                          APP-2026-1007
                        </div>
                      </div>

                      <span class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        Completed
                      </span>

                    </div>

                  </div>

                </div>
              `
            );

            break;


          case 'GIS Explorer':

            handleDashboardAction(
              'Open GIS Map'
            );

            break;


          case 'Documents':

            showDemoModal(
              'Documents',
              `
                <div class="space-y-3">

                  <div class="p-4 border rounded-lg flex items-center gap-3">

                    <span class="material-symbols-outlined text-[#002F6C]">
                      description
                    </span>

                    <div>
                      <div class="font-semibold">
                        Encumbrance Certificate
                      </div>

                      <div class="text-sm text-gray-500">
                        ULP-110-398-B
                      </div>
                    </div>

                  </div>


                  <div class="p-4 border rounded-lg flex items-center gap-3">

                    <span class="material-symbols-outlined text-[#002F6C]">
                      description
                    </span>

                    <div>
                      <div class="font-semibold">
                        Record of Rights
                      </div>

                      <div class="text-sm text-gray-500">
                        ULP-892-441-A
                      </div>
                    </div>

                  </div>

                </div>
              `
            );

            break;


          case 'Payments':

            showDemoModal(
              'Payments',
              `
                <div class="space-y-4">

                  <div class="p-4 border rounded-lg">

                    <div class="flex justify-between">

                      <div>

                        <div class="font-semibold">
                          Land Tax
                        </div>

                        <div class="text-sm text-gray-500">
                          ULP-892-441-A
                        </div>

                      </div>

                      <div class="text-right">

                        <div class="font-bold">
                          ₹4,850
                        </div>

                        <div class="text-xs text-green-600">
                          Paid
                        </div>

                      </div>

                    </div>

                  </div>


                  <div class="p-4 border rounded-lg">

                    <div class="flex justify-between">

                      <div>

                        <div class="font-semibold">
                          Registration Fee
                        </div>

                        <div class="text-sm text-gray-500">
                          APP-2026-1042
                        </div>

                      </div>

                      <div class="text-right">

                        <div class="font-bold">
                          ₹2,100
                        </div>

                        <div class="text-xs text-orange-600">
                          Pending
                        </div>

                      </div>

                    </div>

                  </div>

                </div>
              `
            );

            break;


          case 'Settings':

            showDemoModal(
              'Settings',
              `
                <div class="space-y-4">

                  <div class="p-4 bg-gray-50 rounded-lg">

                    <div class="font-semibold">
                      Profile
                    </div>

                    <div class="text-sm text-gray-500 mt-1">
                      Manage your citizen profile
                    </div>

                  </div>


                  <div class="p-4 bg-gray-50 rounded-lg">

                    <div class="font-semibold">
                      Language
                    </div>

                    <div class="text-sm text-gray-500 mt-1">
                      English / Hindi
                    </div>

                  </div>


                  <div class="p-4 bg-gray-50 rounded-lg">

                    <div class="font-semibold">
                      Notifications
                    </div>

                    <div class="text-sm text-gray-500 mt-1">
                      Manage dashboard notifications
                    </div>

                  </div>

                </div>
              `
            );

            break;


          default:

            console.log(
              `[Dashboard] Navigation clicked: ${label}`
            );

        }

      }
    );
  });


  // ----------------------------------------------------------
  // Top navbar Services / Help
  // ----------------------------------------------------------

  const topLinks =
    document.querySelectorAll(
      'nav a[href="#"]'
    );


  topLinks.forEach((link) => {

    const label =
      link.textContent.trim();


    if (label === 'Services') {

      link.addEventListener(
        'click',
        (event) => {

          event.preventDefault();

          handleDashboardAction(
            'Apply for Service'
          );

        }
      );
    }


    if (label === 'Help') {

      link.addEventListener(
        'click',
        (event) => {

          event.preventDefault();

          showDemoModal(
            'Bharat Bhumi Help',
            `
              <div class="space-y-4">

                <div class="p-4 bg-gray-50 rounded-lg">

                  <div class="font-semibold">
                    ULPIN Search
                  </div>

                  <div class="text-sm text-gray-500 mt-1">
                    Search your property using its
                    Unique Land Parcel Identification Number.
                  </div>

                </div>


                <div class="p-4 bg-gray-50 rounded-lg">

                  <div class="font-semibold">
                    Property Services
                  </div>

                  <div class="text-sm text-gray-500 mt-1">
                    Apply for mutation, land records,
                    certificates and other services.
                  </div>

                </div>


                <div class="p-4 bg-gray-50 rounded-lg">

                  <div class="font-semibold">
                    Need Assistance?
                  </div>

                  <div class="text-sm text-gray-500 mt-1">
                    Contact your local land administration
                    office for official support.
                  </div>

                </div>

              </div>
            `
          );

        }
      );
    }
  });
}


// ============================================================
// DEMO MODAL
// ============================================================

function showDemoModal(title, body) {

  let modal =
    document.getElementById(
      'dashboard-demo-modal'
    );


  // ----------------------------------------------------------
  // Create modal once
  // ----------------------------------------------------------

  if (!modal) {

    modal =
      document.createElement('div');


    modal.id =
      'dashboard-demo-modal';


    modal.className =
      'fixed inset-0 z-[100] hidden items-center justify-center bg-black/40 backdrop-blur-sm p-4';


    modal.innerHTML = `
      <div
        class="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        <div
          class="flex items-center justify-between p-5 border-b">

          <h3
            id="dashboard-modal-title"
            class="text-xl font-bold text-gray-900">
          </h3>


          <button
            id="dashboard-modal-close"
            class="p-2 rounded-lg hover:bg-gray-100 transition"
            aria-label="Close">

            <span class="material-symbols-outlined">
              close
            </span>

          </button>

        </div>


        <div
          id="dashboard-modal-body"
          class="p-5">
        </div>

      </div>
    `;


    document.body.appendChild(modal);


    // Close button

    const closeButton =
      document.getElementById(
        'dashboard-modal-close'
      );


    if (closeButton) {

      closeButton.addEventListener(
        'click',
        closeDemoModal
      );
    }


    // Click outside modal

    modal.addEventListener(
      'click',
      (event) => {

        if (event.target === modal) {

          closeDemoModal();
        }
      }
    );
  }


  // ----------------------------------------------------------
  // Update content
  // ----------------------------------------------------------

  const titleElement =
    document.getElementById(
      'dashboard-modal-title'
    );


  const bodyElement =
    document.getElementById(
      'dashboard-modal-body'
    );


  if (titleElement) {

    titleElement.textContent =
      title;
  }


  if (bodyElement) {

    bodyElement.innerHTML =
      body;
  }


  // ----------------------------------------------------------
  // Show modal
  // ----------------------------------------------------------

  modal.classList.remove('hidden');

  modal.classList.add('flex');


  // Prevent background scrolling

  document.body.style.overflow =
    'hidden';
}


// ============================================================
// CLOSE DEMO MODAL
// ============================================================

function closeDemoModal() {

  const modal =
    document.getElementById(
      'dashboard-demo-modal'
    );


  if (!modal) return;


  modal.classList.add('hidden');

  modal.classList.remove('flex');


  document.body.style.overflow =
    '';
}


// Make close function available to inline demo button

window.closeDashboardModal =
  closeDemoModal;


// ============================================================
// ESC KEY CLOSE
// ============================================================

document.addEventListener(
  'keydown',
  (event) => {

    if (event.key === 'Escape') {

      closeDemoModal();
    }
  }
);