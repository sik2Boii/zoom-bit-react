import { useEffect, useState, useRef } from "react";

function Top10List() {
  const [top10Data, setTop10Data] = useState([]);
  const [highlightedIndexes, setHighlightedIndexes] = useState(new Set());
  const prevTop10DataRef = useRef([]);
  const socketRef = useRef(null);

  // 초기 데이터 로드
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8080/api/get-top10");
        const data = await response.json();
        setTop10Data(data);
        prevTop10DataRef.current = data;
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      }
    };

    fetchInitialData();
  }, []);

  // WebSocket 연결
  useEffect(() => {
    const connectWebSocket = () => {
      const socket = new WebSocket("ws://127.0.0.1:8080/ws/get-top10");
      socketRef.current = socket;

      socket.onopen = () => {
        console.log("WebSocket connection established.");
      };

      socket.onmessage = (event) => {
        console.log("Received message:", event.data);
        try {
          const data = JSON.parse(event.data);
          console.log("Parsed data:", data);

          const changedIndexes = new Set();
          data.forEach((item, index) => {
            if (prevTop10DataRef.current[index]) {
              // 디버그 로그 추가
              console.log(
                `Index ${index}: prev=${prevTop10DataRef.current[index].trade_price}, current=${item.trade_price}`
              );

              if (
                Number(item.trade_price) !==
                Number(prevTop10DataRef.current[index].trade_price)
              ) {
                changedIndexes.add(index);
                // 개별 셀 타이머 적용
                setTimeout(() => {
                  setHighlightedIndexes((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(index);
                    return newSet;
                  });
                }, 3000);
              }
            }
          });

          // 이전 데이터를 업데이트한 후, 현재 데이터 설정
          prevTop10DataRef.current = [...data];
          setTop10Data(data);

          // 새로 변경된 인덱스들을 이전에 추가된 것과 합침
          setHighlightedIndexes(
            (prev) => new Set([...prev, ...changedIndexes])
          );
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
          console.log("Reconnecting...");
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

  // 변경된 가격 셀에만 스타일 적용
  const getCellStyle = (index, currentValue, prevValue) => {
    if (!highlightedIndexes.has(index)) {
      return {};
    }
    return Number(currentValue) > Number(prevValue)
      ? { color: "green", fontWeight: "bold" }
      : { color: "red", fontWeight: "bold" };
  };

  return (
    <table
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
        {top10Data.map((item, index) => {
          const prevItem = prevTop10DataRef.current[index];
          return (
            <tr key={index}>
              <td>{item.market}</td>
              <td
                style={getCellStyle(
                  index,
                  item.trade_price,
                  prevItem?.trade_price
                )}
              >
                {Number(item.trade_price).toLocaleString()}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default Top10List;
