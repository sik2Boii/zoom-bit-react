import { useState } from "react";
import PropTypes from "prop-types";

function AlarmModal({ market, onClose, onSubmit }) {
  const [targetPrice, setTargetPrice] = useState("");
  const [contact, setContact] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      market,
      targetPrice: Number(targetPrice),
      contact,
    });
    onClose();
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={headerStyle}>{market} 알람 신청</h2>
        <form onSubmit={handleSubmit}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>
              목표 가격:
              <input
                type="String"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                required
                style={inputStyle}
              />
            </label>
          </div>
          <div style={formGroupStyle}>
            <label style={labelStyle}>
              이메일 또는 전화번호:
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                required
                style={inputStyle}
              />
            </label>
          </div>
          <div style={buttonGroupStyle}>
            <button type="submit" style={buttonStyle}>
              신청
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{ ...buttonStyle, marginLeft: "10px" }}
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0,0,0,0.3)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalContentStyle = {
  backgroundColor: "#fff",
  padding: "20px",
  border: "1px solid #ccc",
  color: "#000",
  minWidth: "300px",
};

const headerStyle = {
  marginBottom: "15px",
};

const formGroupStyle = {
  marginBottom: "15px",
};

const labelStyle = {
  display: "block",
  color: "#000",
  fontSize: "14px",
  marginBottom: "5px",
};

const inputStyle = {
  width: "100%",
  padding: "8px",
  fontSize: "14px",
  boxSizing: "border-box",
};

const buttonGroupStyle = {
  marginTop: "15px",
};

const buttonStyle = {
  padding: "8px 12px",
  fontSize: "14px",
};

AlarmModal.propTypes = {
  market: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default AlarmModal;
