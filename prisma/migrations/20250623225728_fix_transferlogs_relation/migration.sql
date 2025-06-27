BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [password] NVARCHAR(1000) NOT NULL,
    [isActive] BIT NOT NULL CONSTRAINT [User_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [roleId] NVARCHAR(1000) NOT NULL,
    [storeId] NVARCHAR(1000),
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[Role] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [homeRoute] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Role_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Role_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[Permission] (
    [id] NVARCHAR(1000) NOT NULL,
    [action] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    CONSTRAINT [Permission_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Permission_action_key] UNIQUE NONCLUSTERED ([action])
);

-- CreateTable
CREATE TABLE [dbo].[Store] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [isActive] BIT NOT NULL CONSTRAINT [Store_isActive_df] DEFAULT 1,
    CONSTRAINT [Store_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[SupervisorStores] (
    [userId] NVARCHAR(1000) NOT NULL,
    [storeId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [SupervisorStores_pkey] PRIMARY KEY CLUSTERED ([userId],[storeId])
);

-- CreateTable
CREATE TABLE [dbo].[SystemConfig] (
    [key] NVARCHAR(1000) NOT NULL,
    [value] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [SystemConfig_pkey] PRIMARY KEY CLUSTERED ([key])
);

-- CreateTable
CREATE TABLE [dbo].[Product] (
    [id] NVARCHAR(1000) NOT NULL,
    [sku] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [cost] FLOAT(53) NOT NULL CONSTRAINT [Product_cost_df] DEFAULT 0,
    [price] FLOAT(53) NOT NULL CONSTRAINT [Product_price_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Product_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Product_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Product_sku_key] UNIQUE NONCLUSTERED ([sku])
);

-- CreateTable
CREATE TABLE [dbo].[Inventory] (
    [id] NVARCHAR(1000) NOT NULL,
    [storeId] NVARCHAR(1000) NOT NULL,
    [productId] NVARCHAR(1000) NOT NULL,
    [stock] INT NOT NULL CONSTRAINT [Inventory_stock_df] DEFAULT 0,
    [inTransit] INT NOT NULL CONSTRAINT [Inventory_inTransit_df] DEFAULT 0,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Inventory_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Inventory_storeId_productId_key] UNIQUE NONCLUSTERED ([storeId],[productId])
);

-- CreateTable
CREATE TABLE [dbo].[MovementType] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    CONSTRAINT [MovementType_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [MovementType_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[MovementStatus] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    CONSTRAINT [MovementStatus_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [MovementStatus_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[Movement] (
    [id] NVARCHAR(1000) NOT NULL,
    [documentNumber] NVARCHAR(1000),
    [transactionNumber] NVARCHAR(1000),
    [observations] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Movement_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [typeId] NVARCHAR(1000) NOT NULL,
    [statusId] NVARCHAR(1000) NOT NULL,
    [originStoreId] NVARCHAR(1000),
    [destinationStoreId] NVARCHAR(1000),
    [confirmedByUserId] NVARCHAR(1000),
    [parentMovementId] NVARCHAR(1000),
    CONSTRAINT [Movement_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Movement_documentNumber_key] UNIQUE NONCLUSTERED ([documentNumber])
);

-- CreateTable
CREATE TABLE [dbo].[MovementItem] (
    [id] NVARCHAR(1000) NOT NULL,
    [movementId] NVARCHAR(1000) NOT NULL,
    [productId] NVARCHAR(1000) NOT NULL,
    [quantityExpected] INT NOT NULL,
    [quantityReceived] INT,
    [boxId] NVARCHAR(1000),
    CONSTRAINT [MovementItem_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Box] (
    [id] NVARCHAR(1000) NOT NULL,
    [movementId] NVARCHAR(1000) NOT NULL,
    [boxNumber] INT NOT NULL,
    [isClosed] BIT NOT NULL CONSTRAINT [Box_isClosed_df] DEFAULT 0,
    CONSTRAINT [Box_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[TransferIncident] (
    [id] NVARCHAR(1000) NOT NULL,
    [movementId] NVARCHAR(1000) NOT NULL,
    [detectedByUserId] NVARCHAR(1000) NOT NULL,
    [detectedStoreId] NVARCHAR(1000) NOT NULL,
    [detectedAt] DATETIME2 NOT NULL CONSTRAINT [TransferIncident_detectedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [incidentType] NVARCHAR(1000) NOT NULL,
    [notes] NVARCHAR(1000),
    [resolvedByUserId] NVARCHAR(1000),
    [resolvedAt] DATETIME2,
    [resolutionNotes] NVARCHAR(1000),
    CONSTRAINT [TransferIncident_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[InventoryLoss] (
    [id] NVARCHAR(1000) NOT NULL,
    [productId] NVARCHAR(1000) NOT NULL,
    [quantity] INT NOT NULL,
    [reason] NVARCHAR(1000) NOT NULL,
    [recordedByUserId] NVARCHAR(1000) NOT NULL,
    [occurredAt] DATETIME2 NOT NULL CONSTRAINT [InventoryLoss_occurredAt_df] DEFAULT CURRENT_TIMESTAMP,
    [storeId] NVARCHAR(1000),
    [movementId] NVARCHAR(1000),
    CONSTRAINT [InventoryLoss_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[AuditLog] (
    [id] NVARCHAR(1000) NOT NULL,
    [timestamp] DATETIME2 NOT NULL CONSTRAINT [AuditLog_timestamp_df] DEFAULT CURRENT_TIMESTAMP,
    [userId] NVARCHAR(1000) NOT NULL,
    [action] NVARCHAR(1000) NOT NULL,
    [details] NVARCHAR(1000),
    CONSTRAINT [AuditLog_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ReceptionLog] (
    [id] NVARCHAR(1000) NOT NULL,
    [folioSAP] NVARCHAR(1000) NOT NULL,
    [linenum] INT NOT NULL,
    [articulo] NVARCHAR(1000) NOT NULL,
    [cantidadEsperada] INT NOT NULL,
    [cantidadRecibida] INT NOT NULL,
    [diferencia] INT NOT NULL,
    [motivo] NVARCHAR(1000),
    [observaciones] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ReceptionLog_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ReceptionLog_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ReceptionLog_folioSAP_linenum_key] UNIQUE NONCLUSTERED ([folioSAP],[linenum])
);

-- CreateTable
CREATE TABLE [dbo].[_RolePermissions] (
    [A] NVARCHAR(1000) NOT NULL,
    [B] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [_RolePermissions_AB_unique] UNIQUE NONCLUSTERED ([A],[B])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [_RolePermissions_B_index] ON [dbo].[_RolePermissions]([B]);

-- AddForeignKey
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_roleId_fkey] FOREIGN KEY ([roleId]) REFERENCES [dbo].[Role]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_storeId_fkey] FOREIGN KEY ([storeId]) REFERENCES [dbo].[Store]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[SupervisorStores] ADD CONSTRAINT [SupervisorStores_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[SupervisorStores] ADD CONSTRAINT [SupervisorStores_storeId_fkey] FOREIGN KEY ([storeId]) REFERENCES [dbo].[Store]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Inventory] ADD CONSTRAINT [Inventory_storeId_fkey] FOREIGN KEY ([storeId]) REFERENCES [dbo].[Store]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Inventory] ADD CONSTRAINT [Inventory_productId_fkey] FOREIGN KEY ([productId]) REFERENCES [dbo].[Product]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Movement] ADD CONSTRAINT [Movement_typeId_fkey] FOREIGN KEY ([typeId]) REFERENCES [dbo].[MovementType]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Movement] ADD CONSTRAINT [Movement_statusId_fkey] FOREIGN KEY ([statusId]) REFERENCES [dbo].[MovementStatus]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Movement] ADD CONSTRAINT [Movement_originStoreId_fkey] FOREIGN KEY ([originStoreId]) REFERENCES [dbo].[Store]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Movement] ADD CONSTRAINT [Movement_destinationStoreId_fkey] FOREIGN KEY ([destinationStoreId]) REFERENCES [dbo].[Store]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Movement] ADD CONSTRAINT [Movement_confirmedByUserId_fkey] FOREIGN KEY ([confirmedByUserId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Movement] ADD CONSTRAINT [Movement_parentMovementId_fkey] FOREIGN KEY ([parentMovementId]) REFERENCES [dbo].[Movement]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[MovementItem] ADD CONSTRAINT [MovementItem_movementId_fkey] FOREIGN KEY ([movementId]) REFERENCES [dbo].[Movement]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[MovementItem] ADD CONSTRAINT [MovementItem_productId_fkey] FOREIGN KEY ([productId]) REFERENCES [dbo].[Product]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[MovementItem] ADD CONSTRAINT [MovementItem_boxId_fkey] FOREIGN KEY ([boxId]) REFERENCES [dbo].[Box]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Box] ADD CONSTRAINT [Box_movementId_fkey] FOREIGN KEY ([movementId]) REFERENCES [dbo].[Movement]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[TransferIncident] ADD CONSTRAINT [TransferIncident_movementId_fkey] FOREIGN KEY ([movementId]) REFERENCES [dbo].[Movement]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[InventoryLoss] ADD CONSTRAINT [InventoryLoss_productId_fkey] FOREIGN KEY ([productId]) REFERENCES [dbo].[Product]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[InventoryLoss] ADD CONSTRAINT [InventoryLoss_movementId_fkey] FOREIGN KEY ([movementId]) REFERENCES [dbo].[Movement]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[AuditLog] ADD CONSTRAINT [AuditLog_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ReceptionLog] ADD CONSTRAINT [ReceptionLog_folioSAP_fkey] FOREIGN KEY ([folioSAP]) REFERENCES [dbo].[Movement]([documentNumber]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[_RolePermissions] ADD CONSTRAINT [_RolePermissions_A_fkey] FOREIGN KEY ([A]) REFERENCES [dbo].[Permission]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[_RolePermissions] ADD CONSTRAINT [_RolePermissions_B_fkey] FOREIGN KEY ([B]) REFERENCES [dbo].[Role]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
