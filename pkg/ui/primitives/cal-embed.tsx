import { useEffect, useRef } from 'react';

interface CalComEmbedProps {
  calLink?: string;
  email?: string;
  name?: string;
  meetingDate?: string;
  height?: string | number;
  className?: string;
}

export const CalComEmbed = ({
  calLink = 'adnexus/15min',
  email,
  name,
  meetingDate,
  height = '600px',
  className = ''
}: CalComEmbedProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Build cal.com URL with parameters
  const buildCalUrl = () => {
    const params = new URLSearchParams();

    if (email) params.append('email', email);
    if (name) params.append('name', name);
    if (meetingDate) params.append('date', meetingDate);

    // Always enable overlay for better UX
    params.append('embed', 'true');

    const queryString = params.toString();
    return `https://cal.com/${calLink}${queryString ? `?${queryString}` : ''}`;
  };

  useEffect(() => {
    // Cal.com embed script for better integration
    const script = document.createElement('script');
    script.src = 'https://app.cal.com/embed/embed.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <div className={`cal-embed-container ${className}`}>
      <iframe
        ref={iframeRef}
        src={buildCalUrl()}
        width="100%"
        height={height}
        frameBorder="0"
        allow="camera; microphone; autoplay; encrypted-media;"
        style={{
          border: 'none',
          borderRadius: '8px',
          overflow: 'hidden'
        }}
        data-cal-link={calLink}
        data-cal-config='{"layout":"month_view"}'
      />
    </div>
  );
};

export default CalComEmbed;
