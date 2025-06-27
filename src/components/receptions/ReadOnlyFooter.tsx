'use client';

import { Button, Card } from 'react-bootstrap';
import Link from 'next/link';

interface ReadOnlyFooterProps {
    folioSAP: string;
}

export default function ReadOnlyFooter({ folioSAP }: ReadOnlyFooterProps) {
    // En el futuro, esta URL podría venir de la base de datos
    const pdfUrl = `/reports/reception_${folioSAP}.pdf`;

    return (
        <Card className="mt-4">
            <Card.Header as="h5">Recepción Finalizada</Card.Header>
            <Card.Body className="text-center">
                <Card.Text>
                    Esta recepción ya ha sido procesada y no puede ser modificada.
                </Card.Text>
                <Link href={pdfUrl} passHref legacyBehavior>
                    <a target="_blank" rel="noopener noreferrer">
                        <Button variant="secondary">
                            Descargar Informe PDF
                        </Button>
                    </a>
                </Link>
            </Card.Body>
        </Card>
    );
}
