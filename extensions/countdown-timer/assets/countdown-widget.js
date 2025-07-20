import { h, render } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import './countdown-widget.css'; // if you're bundling CSS via esbuild; otherwise load CSS separately

function CountdownTimer({ productId, shopDomain, thresholdMins }) {
  const [remaining, setRemaining] = useState(null);
  const [color, setColor]         = useState('#000');
  console.log("location====",window.location.host)
  useEffect(() => {
    let intervalId;
 console.log("testing")
    // Fetch the single active timer for this product
    fetch(
      `https://${window.location.host}/api/timers?shop=${encodeURIComponent(shopDomain)}`
      + `&productId=${encodeURIComponent(productId)}&active=True`
    )
      .then(res => res.json())
      .then(timers => {
        if (timers.length === 0) {
          setRemaining(0);
          return;
        }
        const timer = timers[0];
        setColor(timer.displayOptions?.color || '#000');
        const endAt = new Date(timer.endAt).getTime();

        // Update remaining time every second
        const update = () => {
          const diff = endAt - Date.now();
          setRemaining(diff > 0 ? diff : 0);
        };
        update();
        intervalId = setInterval(update, 1000);
      })
      .catch(err => {
        console.error('Error loading timer:', err);
        setRemaining(0);
      });

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [productId, shopDomain]);

  if (remaining === null || remaining === 0) {
    return null;
  }

  const hours   = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);
  const isUrgent = remaining <= thresholdMins * 60_000;

  return (
    <div
      className={`countdown-widget${isUrgent ? ' urgent' : ''}`}
      style={{ color }}
    >
      {hours}h {minutes}m {seconds}s
    </div>
  );
}

// Mount one widget per block instance
document
  .querySelectorAll('[id^="countdown-timer-root-"]')
  .forEach(root => {
    try {
      const settings = JSON.parse(root.dataset.settings);
      render(
        <CountdownTimer
          productId={settings.productId}
          shopDomain={settings.shopDomain}
          thresholdMins={settings.thresholdMins}
        />,
        root
      );
    } catch (e) {
      console.error('Failed to mount CountdownTimer:', e);
    }
  });
