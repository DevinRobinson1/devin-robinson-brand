import { Html, Head, Body, Container, Heading, Text, Button } from '@react-email/components';

export function MagicLinkEmail({ magicLink, planDisplayName }: { magicLink: string; planDisplayName: string }) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Inter, sans-serif', backgroundColor: '#f8f7f5' }}>
        <Container style={{ padding: '40px', maxWidth: '560px' }}>
          <Heading>Welcome to your CAIO portal</Heading>
          <Text>You&apos;re on the <strong>{planDisplayName}</strong> plan. Click below to log in — the link is valid for 15 minutes.</Text>
          <Button href={magicLink} style={{ background: '#c45a3c', color: '#fff', padding: '12px 24px', borderRadius: '6px' }}>
            Sign in
          </Button>
          <Text style={{ fontSize: '12px', color: '#666', marginTop: '40px' }}>
            If you didn&apos;t expect this email, you can safely ignore it.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
