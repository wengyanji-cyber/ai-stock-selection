import { useState } from 'react'

type AgreementModalProps = {
  isOpen: boolean
  onClose: () => void
  onAgree: () => void
  type: 'registration' | 'payment'
}

function AgreementModal({ isOpen, onClose, onAgree, type }: AgreementModalProps) {
  const [agreed, setAgreed] = useState({
    userAgreement: false,
    privacyPolicy: false,
    riskDisclosure: false,
  })

  const allAgreed = agreed.userAgreement && agreed.privacyPolicy && agreed.riskDisclosure

  function handleConfirm() {
    if (!allAgreed) return
    onAgree()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div className="modal-content" style={{
        background: 'white',
        borderRadius: '12px',
        padding: '30px',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <h2 style={{ marginBottom: '20px', color: '#333' }}>
          {type === 'registration' ? '注册协议确认' : '支付协议确认'}
        </h2>

        <div style={{ marginBottom: '25px' }}>
          <p style={{ color: '#666', lineHeight: 1.6, marginBottom: '15px' }}>
            为了保障您的权益，请仔细阅读以下协议文件：
          </p>
          
          <div className="stack-list" style={{ marginBottom: '20px' }}>
            <a 
              href="/docs/USER_AGREEMENT.md" 
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#667eea', textDecoration: 'none' }}
            >
              📄 《用户服务协议》
            </a>
            <a 
              href="/docs/PRIVACY_POLICY.md" 
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#667eea', textDecoration: 'none' }}
            >
              📄 《隐私政策》
            </a>
            <a 
              href="/docs/RISK_DISCLOSURE.md" 
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#667eea', textDecoration: 'none' }}
            >
              ⚠️ 《投资风险提示书》
            </a>
          </div>

          <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #ffc107' }}>
            <strong>⚠️ 重要提示：</strong>
            <ul style={{ margin: '10px 0 0 20px', color: '#856404' }}>
              <li>本服务不构成投资建议，不承诺收益</li>
              <li>证券市场有风险，投资需谨慎</li>
              <li>请独立判断，自行承担投资风险</li>
            </ul>
          </div>
        </div>

        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', marginBottom: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={agreed.userAgreement}
              onChange={(e) => setAgreed({ ...agreed, userAgreement: e.target.checked })}
              style={{ marginRight: '8px' }}
            />
            我已阅读并同意《用户服务协议》
          </label>
          <label style={{ display: 'block', marginBottom: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={agreed.privacyPolicy}
              onChange={(e) => setAgreed({ ...agreed, privacyPolicy: e.target.checked })}
              style={{ marginRight: '8px' }}
            />
            我已阅读并同意《隐私政策》
          </label>
          <label style={{ display: 'block', marginBottom: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={agreed.riskDisclosure}
              onChange={(e) => setAgreed({ ...agreed, riskDisclosure: e.target.checked })}
              style={{ marginRight: '8px' }}
            />
            我已阅读并理解《投资风险提示书》
          </label>
        </div>

        <div className="action-row" style={{ justifyContent: 'flex-end' }}>
          <button className="secondary-button" onClick={onClose}>
            取消
          </button>
          <button 
            className="primary-button" 
            onClick={handleConfirm}
            disabled={!allAgreed}
            style={{ opacity: allAgreed ? 1 : 0.6, cursor: allAgreed ? 'pointer' : 'not-allowed' }}
          >
            同意并继续
          </button>
        </div>
      </div>
    </div>
  )
}

export default AgreementModal
