import { useEffect, useState, useRef } from "react";
import AlarmModal from "./AlarmModal";

function Top10List() {
  const [top10Data, setTop10Data] = useState([]);
  const [highlightedIndexes, setHighlightedIndexes] = useState(new Set());
  const [showAlarmModal, setShowAlarmModal] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState(null);

  // 이전 데이터를 깊은 복사로 저장 (전체 데이터 비교용)
  const prevTop10DataRef = useRef([]);
  // 데이터 변경 시점의 이전 가격을 저장 (강조 스타일 비교용)
  const changedPricesRef = useRef({});
  const socketRef = useRef(null);

  // 초기 데이터 로드
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await fetch("https://3.82.228.203:8080/api/get-top10");
        const data = await response.json();
        setTop10Data(data);
        // 깊은 복사(deep copy)로 이전 데이터를 저장
        prevTop10DataRef.current = data.map((item) => ({ ...item }));
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      }
    };

    fetchInitialData();
  }, []);

  // WebSocket 연결
  useEffect(() => {
    const connectWebSocket = () => {
      const socket = new WebSocket("wss://3.82.228.203:8080/ws/get-top10");
      socketRef.current = socket;

      socket.onopen = () => {};

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const changedIndexes = new Set();

          data.forEach((item, index) => {
            if (prevTop10DataRef.current[index]) {
              const prevPrice = Number(
                prevTop10DataRef.current[index].trade_price
              );
              const currentPrice = Number(item.trade_price);

              // 가격이 변한 경우
              if (currentPrice !== prevPrice) {
                changedIndexes.add(index);
                // 강조 스타일 비교에 사용할 이전 가격을 저장
                changedPricesRef.current[index] = prevPrice;
                // 3초 후에 강조 효과 해제
                setTimeout(() => {
                  setHighlightedIndexes((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(index);
                    return newSet;
                  });
                  delete changedPricesRef.current[index];
                }, 3000);
              }
            }
          });

          setHighlightedIndexes(
            (prev) => new Set([...prev, ...changedIndexes])
          );
          setTop10Data(data);
          prevTop10DataRef.current = data.map((item) => ({ ...item }));
        } catch (error) {
          console.error("Failed to parse message:", error);
        }
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      socket.onclose = (event) => {
        console.warn("WebSocket connection closed:", event.reason);
        setTimeout(() => {
          connectWebSocket();
        }, 5000);
      };
    };

    connectWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  // 스타일 적용 함수
  const getCellStyle = (index, currentValue) => {
    if (!highlightedIndexes.has(index)) {
      return {};
    }
    const prevValue = changedPricesRef.current[index];
    if (prevValue === undefined || prevValue === null) {
      return {};
    }
    return Number(currentValue) > Number(prevValue)
      ? { color: "green", fontWeight: "bold" }
      : { color: "red", fontWeight: "bold" };
  };

  // 특정 거래소(마켓) 클릭 시 모달 열기
  const handleMarketClick = (marketInfo) => {
    setSelectedMarket(marketInfo.market);
    setShowAlarmModal(true);
  };

  // 모달 닫기
  const handleModalClose = () => {
    setShowAlarmModal(false);
    setSelectedMarket(null);
  };

  // 알람 신청 제출 처리
  const handleAlarmSubmit = async ({ market, targetPrice, contact }) => {
    try {
      await fetch("http://127.0.0.1:8080/api/submit-alarm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ market, targetPrice, contact }),
      });
      alert("알람 신청이 되었습니다!");
    } catch (error) {
      console.error("Alarm submit error:", error);
    }
  };

  return (
    <>
      <table
        className="top30-table"
        border="1"
        style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th>Market</th>
            <th>Trade Price (KRW)</th>
          </tr>
        </thead>
        <tbody>
          {top10Data.map((item, index) => (
            <tr
              key={index}
              className="table-row"
              onClick={() => handleMarketClick(item)}
              style={{ cursor: "pointer" }}
            >
              <td>{item.market}</td>
              <td style={getCellStyle(index, item.trade_price)}>
                {Number(item.trade_price).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showAlarmModal && selectedMarket && (
        <AlarmModal
          market={selectedMarket}
          onClose={handleModalClose}
          onSubmit={handleAlarmSubmit}
        />
      )}
    </>
  );
}

export default Top10List;
