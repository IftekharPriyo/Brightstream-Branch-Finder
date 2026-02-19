export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-brand">
          <h3>Brightstream</h3>
          <p>
            Banking reimagined for modern life. Experience financial excellence
            that elevates every aspect of your journey.
          </p>
        </div>

        <div className="footer-section">
          <h4>Products</h4>
          <ul className="footer-links">
            <li><a href="#">Personal Banking</a></li>
            <li><a href="#">Business Banking</a></li>
            <li><a href="#">Wealth Management</a></li>
            <li><a href="#">Credit Cards</a></li>
            <li><a href="#">Loans & Mortgages</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Company</h4>
          <ul className="footer-links">
            <li><a href="#">About Us</a></li>
            <li><a href="#">Careers</a></li>
            <li><a href="#">Press</a></li>
            <li><a href="#">Sustainability</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Support</h4>
          <ul className="footer-links">
            <li><a href="#">Help Center</a></li>
            <li><a href="#">Security</a></li>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms of Service</a></li>
            <li><a href="#">Accessibility</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>
          © 2024 Brightstream Bank. All rights reserved. Member FDIC. Equal
          Housing Lender.
        </p>
        <div className="social-links">
          <a href="#">LinkedIn</a>
          <a href="#">Twitter</a>
          <a href="#">Facebook</a>
          <a href="#">Instagram</a>
        </div>
      </div>
    </footer>
  );
}
