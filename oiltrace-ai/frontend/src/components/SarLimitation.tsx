import React from 'react';

export default function SarLimitation() {
  return (
    <div className="alert alert-warning" style={{borderRadius:'var(--radius)',fontSize:'12px'}}>
      <span>⚠</span>
      <div>
        <strong>Scientific Limitation:</strong> SAR dark regions are not necessarily oil.
        Low-wind zones, ship wakes, biogenic slicks and other phenomena can resemble oil.
        Detection should be treated as investigative evidence requiring expert review.
      </div>
    </div>
  );
}
