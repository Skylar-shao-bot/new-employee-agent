import { Card, Typography } from 'antd';

const { Title, Text } = Typography;

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="ds-page-shell">
      <div className="ds-page-header">
        <Title level={4} className="ds-page-title">
          {title}
        </Title>
      </div>
      <Card bordered={false} className="ds-page-card">
        <Text type="secondary">{description}</Text>
      </Card>
    </div>
  );
}
