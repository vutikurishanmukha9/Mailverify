import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { CreditPackage } from '../types';
import {
  Coins,
  Check,
  CreditCard,
  Info
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Card, CardBody } from '../components/common/Card';
import { Modal } from '../components/common/Modal';

export const BuyCreditsPage: React.FC = () => {
  const { creditPackages, purchaseCredits, subscription, navigateTo } = useApp();

  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleOpenCheckout = (pkg: CreditPackage) => {
    setSelectedPackage(pkg);
    setIsCheckoutModalOpen(true);
  };

  const handleConfirmPurchase = () => {
    if (!selectedPackage) return;

    setIsProcessing(true);
    setTimeout(() => {
      purchaseCredits(selectedPackage.id);
      setIsProcessing(false);
      setIsCheckoutModalOpen(false);
      setSelectedPackage(null);
    }, 600);
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-header-title">Purchase Add-on Credits</h1>
          <p className="page-header-description">
            Add-on credits never expire and roll over indefinitely. They are automatically drawn
            whenever your monthly plan allowance is exhausted.
          </p>
        </div>
      </div>

      {/* Balance Summary Header Card */}
      <Card style={{ marginBottom: 28 }}>
        <CardBody>
          <div className="balance-banner-row">
            <div>
              <div className="balance-banner-label">CURRENT TOTAL BALANCE</div>
              <div className="balance-banner-val font-mono tabular-nums">
                {subscription.creditsRemaining.toLocaleString()} <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>credits</span>
              </div>
              <div className="balance-banner-sub">
                Includes {subscription.addonCredits.toLocaleString()} non-expiring rollover reserve
              </div>
            </div>

            <div className="balance-features-list">
              <div className="balance-feature-item">
                <Check size={14} className="text-success" />
                <span>Never expire or reset</span>
              </div>
              <div className="balance-feature-item">
                <Check size={14} className="text-success" />
                <span>Works with Single, Bulk & API verification</span>
              </div>
              <div className="balance-feature-item">
                <Check size={14} className="text-success" />
                <span>Immediate balance activation</span>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Credit Packages Grid */}
      <div className="packages-grid">
        {creditPackages.map((pkg) => {
          const isPopular = pkg.badge === 'Most Popular';

          return (
            <Card
              key={pkg.id}
              className={`package-card ${isPopular ? 'package-popular' : ''}`}
            >
              <CardBody style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Badge if any */}
                <div className="pkg-badge-wrapper">
                  {pkg.badge && (
                    <Badge variant={isPopular ? 'accent' : 'success'}>{pkg.badge}</Badge>
                  )}
                </div>

                <div className="pkg-credits-heading font-mono tabular-nums">
                  {pkg.credits.toLocaleString()}
                </div>
                <div className="pkg-credits-sub">Verification Credits</div>

                <div className="pkg-price-row">
                  <span className="pkg-price font-mono">${pkg.price}</span>
                  <span className="pkg-unit font-mono tabular-nums">
                    ${pkg.unitPrice.toFixed(4)} / credit
                  </span>
                </div>

                <ul className="pkg-feature-checks">
                  <li>Full RFC, MX & SMTP engine</li>
                  <li>Disposable & spam trap detection</li>
                  <li>No recurring monthly fee</li>
                  <li>Downloadable PDF tax receipt</li>
                </ul>

                <div style={{ marginTop: 'auto', paddingTop: 16 }}>
                  <Button
                    variant={isPopular ? 'primary' : 'secondary'}
                    size="md"
                    style={{ width: '100%' }}
                    onClick={() => handleOpenCheckout(pkg)}
                    leftIcon={<Coins size={14} />}
                  >
                    Buy {pkg.credits.toLocaleString()} Credits
                  </Button>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Transparent FAQ / Policy Note */}
      <Card style={{ marginTop: 28 }}>
        <CardBody>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <Info size={20} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: 2 }} />
            <div>
              <h3 style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>
                Transparent Credit Usage Policy
              </h3>
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                1 credit verifies 1 email address across all verification pipelines (Single Verify,
                Bulk CSV jobs, Google Sheets sync, and Developer API). Syntax errors and duplicate
                entries omitted before processing do not consume credits. Charges are billed
                instantly to your default payment method.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Checkout Confirmation Modal */}
      {selectedPackage && (
        <Modal
          isOpen={isCheckoutModalOpen}
          onClose={() => setIsCheckoutModalOpen(false)}
          title="Review & Confirm Credit Purchase"
          maxWidth={480}
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, width: '100%' }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCheckoutModalOpen(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmPurchase}
                isLoading={isProcessing}
              >
                Authorize & Charge ${selectedPackage.price}.00
              </Button>
            </div>
          }
        >
          <div className="checkout-breakdown">
            <div className="checkout-summary-box">
              <div className="checkout-row">
                <span className="text-secondary">Item</span>
                <span className="font-mono text-primary font-bold">
                  {selectedPackage.credits.toLocaleString()} Verification Credits
                </span>
              </div>
              <div className="checkout-row">
                <span className="text-secondary">Unit Rate</span>
                <span className="font-mono text-muted tabular-nums">
                  ${selectedPackage.unitPrice.toFixed(4)} per verification
                </span>
              </div>
              <div className="checkout-row">
                <span className="text-secondary">Taxes & Fees</span>
                <span className="font-mono text-muted">$0.00</span>
              </div>
              <div className="checkout-divider" />
              <div className="checkout-row checkout-total">
                <span>Total Amount</span>
                <span className="font-mono text-accent font-bold" style={{ fontSize: 18 }}>
                  ${selectedPackage.price}.00 USD
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="checkout-payment-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CreditCard size={18} style={{ color: 'var(--text-primary)' }} />
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {subscription.paymentMethod.brand} ending in {subscription.paymentMethod.last4}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Expires {subscription.paymentMethod.expMonth}/{subscription.paymentMethod.expYear}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsCheckoutModalOpen(false);
                  navigateTo('settings', 'billing');
                }}
                className="btn-sm"
              >
                Change
              </Button>
            </div>

            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.4 }}>
              By clicking Authorize, you agree that {selectedPackage.credits.toLocaleString()} credits
              will be applied immediately to your balance and your credit card will be charged ${selectedPackage.price}.00.
            </div>
          </div>
        </Modal>
      )}

      <style>{`
        .balance-banner-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--space-4);
          flex-wrap: wrap;
        }

        .balance-banner-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          letter-spacing: 0.05em;
          margin-bottom: 2px;
        }

        .balance-banner-val {
          font-size: 26px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 2px;
        }

        .balance-banner-sub {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .balance-features-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .balance-feature-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--text-secondary);
        }

        .packages-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: var(--space-4);
        }

        .package-card {
          position: relative;
          transition: transform 0.15s ease, border-color 0.15s ease;
        }
        .package-card:hover {
          border-color: var(--border-strong);
        }
        .package-card.package-popular {
          border-color: var(--accent-primary);
          background-color: #121317;
        }

        .pkg-badge-wrapper {
          min-height: 24px;
          margin-bottom: 8px;
        }

        .pkg-credits-heading {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .pkg-credits-sub {
          font-size: 12px;
          color: var(--text-muted);
          margin-bottom: 14px;
        }

        .pkg-price-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-bottom: 14px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border-subtle);
        }

        .pkg-price {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .pkg-unit {
          font-size: 11.5px;
          color: var(--text-muted);
        }

        .pkg-feature-checks {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 11.5px;
          color: var(--text-secondary);
          margin-bottom: 16px;
        }
        .pkg-feature-checks li::before {
          content: "✓ ";
          color: var(--status-success);
        }

        .checkout-breakdown {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .checkout-summary-box {
          background-color: #101114;
          border: 1px solid var(--border-standard);
          border-radius: var(--radius-sm);
          padding: 12px 14px;
        }

        .checkout-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12.5px;
          margin-bottom: 6px;
        }

        .checkout-divider {
          height: 1px;
          background-color: var(--border-subtle);
          margin: 10px 0;
        }

        .checkout-total {
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0;
        }

        .checkout-payment-card {
          background-color: #121316;
          border: 1px solid var(--border-standard);
          border-radius: var(--radius-sm);
          padding: 10px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        @media (max-width: 768px) {
          .packages-grid {
            grid-template-columns: 1fr;
          }
          .balance-banner-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 14px;
          }
        }
      `}</style>
    </div>
  );
};
